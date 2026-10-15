package com.ftn.laslouri.criticomrade.controller;

import com.ftn.laslouri.criticomrade.dto.CompatibilityDto;
import com.ftn.laslouri.criticomrade.dto.DiaryStatsDto;
import com.ftn.laslouri.criticomrade.dto.MovieDto;
import com.ftn.laslouri.criticomrade.dto.PageResponse;
import com.ftn.laslouri.criticomrade.dto.TasteProfileDto;
import com.ftn.laslouri.criticomrade.dto.UserProfileDto;
import com.ftn.laslouri.criticomrade.dto.UserUpdateRequest;
import com.ftn.laslouri.criticomrade.service.TasteProfileService;
import com.ftn.laslouri.criticomrade.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final TasteProfileService tasteProfileService;

    @GetMapping("/me/suggestions")
    public List<MovieDto> suggestions() {
        return tasteProfileService.suggestions();
    }

    @GetMapping("/{username}/diary-stats")
    public DiaryStatsDto diaryStats(@PathVariable String username) {
        return tasteProfileService.diaryStats(username);
    }

    @GetMapping("/{username}/taste-profile")
    public TasteProfileDto tasteProfile(@PathVariable String username) {
        return tasteProfileService.tasteProfile(username);
    }

    @GetMapping("/{username}/compatibility")
    public CompatibilityDto compatibility(@PathVariable String username) {
        return tasteProfileService.compatibility(username);
    }

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
