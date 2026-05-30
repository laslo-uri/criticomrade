package com.ftn.laslouri.criticomrade.service;

import com.ftn.laslouri.criticomrade.dto.NotificationDto;
import com.ftn.laslouri.criticomrade.dto.PageResponse;
import com.ftn.laslouri.criticomrade.exception.ForbiddenException;
import com.ftn.laslouri.criticomrade.exception.ResourceNotFoundException;
import com.ftn.laslouri.criticomrade.mapper.DtoMapper;
import com.ftn.laslouri.criticomrade.model.Notification;
import com.ftn.laslouri.criticomrade.model.NotificationType;
import com.ftn.laslouri.criticomrade.model.User;
import com.ftn.laslouri.criticomrade.repository.NotificationRepository;
import com.ftn.laslouri.criticomrade.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SecurityUtils securityUtils;

    @Transactional
    public void createNotification(User recipient, User actor, NotificationType type, String message, Long referenceId) {
        if (recipient.getId().equals(actor.getId())) {
            return;
        }
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setActor(actor);
        notification.setType(type);
        notification.setMessage(message);
        notification.setReferenceId(referenceId);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationDto> getMyNotifications(int page, int size) {
        User user = securityUtils.getCurrentUser();
        Page<Notification> notifications = notificationRepository.findByRecipientOrderByCreatedAtDesc(
                user, PageRequest.of(page, size));
        Page<NotificationDto> mapped = notifications.map(n -> DtoMapper.toNotificationDto(n, user));
        return DtoMapper.toPageResponse(mapped);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        User user = securityUtils.getCurrentUser();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));
        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new ForbiddenException("Not authorized");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead() {
        User user = securityUtils.getCurrentUser();
        notificationRepository.findByRecipientOrderByCreatedAtDesc(user, PageRequest.of(0, 1000))
                .forEach(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                });
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        User user = securityUtils.getCurrentUser();
        return notificationRepository.countByRecipientAndReadFalse(user);
    }
}
