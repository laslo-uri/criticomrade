package com.ftn.laslouri.criticomrade.controller;

import com.ftn.laslouri.criticomrade.dto.PageResponse;
import com.ftn.laslouri.criticomrade.dto.UserProfileDto;
import com.ftn.laslouri.criticomrade.dto.UserUpdateRequest;
import com.ftn.laslouri.criticomrade.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{username}")
    public UserProfileDto getProfile(@PathVariable String username) {
        return userService.getProfile(username);
    }

    @PutMapping("/me")
    public UserProfileDto updateProfile(@RequestBody UserUpdateRequest request) {
        return userService.updateProfile(request);
    }

    @GetMapping("/search")
    public PageResponse<UserProfileDto> searchUsers(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return userService.searchUsers(q, page, size);
    }
}
