package com.ftn.laslouri.criticomrade.controller;

import com.ftn.laslouri.criticomrade.dto.NotificationDto;
import com.ftn.laslouri.criticomrade.dto.PageResponse;
import com.ftn.laslouri.criticomrade.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public PageResponse<NotificationDto> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return notificationService.getMyNotifications(page, size);
    }

    @GetMapping("/unread-count")
    public long getUnreadCount() {
        return notificationService.getUnreadCount();
    }

    @PatchMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
    }

    @PatchMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllAsRead() {
        notificationService.markAllAsRead();
    }
}
