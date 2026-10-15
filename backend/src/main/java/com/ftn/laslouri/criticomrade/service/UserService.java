package com.ftn.laslouri.criticomrade.service;

import com.ftn.laslouri.criticomrade.dto.PageResponse;
import com.ftn.laslouri.criticomrade.dto.UserProfileDto;
import com.ftn.laslouri.criticomrade.dto.UserUpdateRequest;
import com.ftn.laslouri.criticomrade.exception.ForbiddenException;
import com.ftn.laslouri.criticomrade.exception.ResourceNotFoundException;
import com.ftn.laslouri.criticomrade.mapper.DtoMapper;
import com.ftn.laslouri.criticomrade.model.User;
import com.ftn.laslouri.criticomrade.repository.UserRepository;
import com.ftn.laslouri.criticomrade.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    @Transactional(readOnly = true)
    public UserProfileDto getProfile(String username) {
        User viewer = securityUtils.getCurrentUserOptional().orElse(null);
        User user = findByUsername(username);
        boolean self = viewer != null && user.getId().equals(viewer.getId());
        boolean followed = viewer != null && user.getFollowers() != null
                && user.getFollowers().stream().anyMatch(f -> f.getId().equals(viewer.getId()));
        if (!user.isProfilePublic() && !self && !followed) {
            throw new ForbiddenException("Profile is private");
        }
        return DtoMapper.toUserProfile(user, viewer);
    }

    @Transactional
    public UserProfileDto updateProfile(UserUpdateRequest request) {
        User user = securityUtils.getCurrentUser();
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getProfilePublic() != null) {
            user.setProfilePublic(request.getProfilePublic());
        }
        return DtoMapper.toUserProfile(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public PageResponse<UserProfileDto> searchUsers(String query, int page, int size) {
        User viewer = securityUtils.getCurrentUser();
        Page<User> users = userRepository.findByUsernameContainingIgnoreCaseOrFullNameContainingIgnoreCase(
                query, query, PageRequest.of(page, size));
        Page<UserProfileDto> mapped = users.map(u -> DtoMapper.toUserProfile(u, viewer));
        return DtoMapper.toPageResponse(mapped);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }
}
