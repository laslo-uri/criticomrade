package com.ftn.laslouri.criticomrade.controller;

import com.ftn.laslouri.criticomrade.dto.FollowRequestDto;
import com.ftn.laslouri.criticomrade.dto.UserProfileDto;
import com.ftn.laslouri.criticomrade.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/follow")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping("/request/{username}")
    @ResponseStatus(HttpStatus.CREATED)
    public FollowRequestDto sendRequest(@PathVariable String username) {
        return followService.sendFollowRequest(username);
    }

    @PostMapping("/accept/{requestId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void accept(@PathVariable Long requestId) {
        followService.acceptFollowRequest(requestId);
    }

    @PostMapping("/reject/{requestId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@PathVariable Long requestId) {
        followService.rejectFollowRequest(requestId);
    }

    @DeleteMapping("/{username}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfollow(@PathVariable String username) {
        followService.unfollow(username);
    }

    @GetMapping("/requests")
    public List<FollowRequestDto> getPendingRequests() {
        return followService.getPendingRequests();
    }

    @GetMapping("/followers/{username}")
    public List<UserProfileDto> getFollowers(@PathVariable String username) {
        return followService.getFollowers(username);
    }

    @GetMapping("/following/{username}")
    public List<UserProfileDto> getFollowing(@PathVariable String username) {
        return followService.getFollowing(username);
    }
}
