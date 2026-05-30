package com.ftn.laslouri.criticomrade.service;

import com.ftn.laslouri.criticomrade.dto.FollowRequestDto;
import com.ftn.laslouri.criticomrade.dto.UserProfileDto;
import com.ftn.laslouri.criticomrade.exception.BadRequestException;
import com.ftn.laslouri.criticomrade.exception.ForbiddenException;
import com.ftn.laslouri.criticomrade.exception.ResourceNotFoundException;
import com.ftn.laslouri.criticomrade.mapper.DtoMapper;
import com.ftn.laslouri.criticomrade.model.FollowRequest;
import com.ftn.laslouri.criticomrade.model.NotificationType;
import com.ftn.laslouri.criticomrade.model.User;
import com.ftn.laslouri.criticomrade.repository.FollowRequestRepository;
import com.ftn.laslouri.criticomrade.repository.UserRepository;
import com.ftn.laslouri.criticomrade.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final UserRepository userRepository;
    private final FollowRequestRepository followRequestRepository;
    private final NotificationService notificationService;
    private final SecurityUtils securityUtils;

    @Transactional
    public FollowRequestDto sendFollowRequest(String targetUsername) {
        User sender = securityUtils.getCurrentUser();
        User receiver = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUsername));

        if (sender.getId().equals(receiver.getId())) {
            throw new BadRequestException("Cannot follow yourself");
        }
        if (sender.getFollowing().contains(receiver)) {
            throw new BadRequestException("Already following this user");
        }
        if (followRequestRepository.existsBySenderAndReceiver(sender, receiver)) {
            throw new BadRequestException("Follow request already pending");
        }

        if (receiver.isProfilePublic()) {
            addFollowRelationship(sender, receiver);
            notificationService.createNotification(receiver, sender, NotificationType.FOLLOW,
                    sender.getUsername() + " started following you", sender.getId());
            return null;
        }

        FollowRequest request = new FollowRequest();
        request.setSender(sender);
        request.setReceiver(receiver);
        request.setRequestDateTime(LocalDateTime.now());
        FollowRequest saved = followRequestRepository.save(request);
        notificationService.createNotification(receiver, sender, NotificationType.FOLLOW_REQUEST,
                sender.getUsername() + " sent you a follow request", saved.getId());
        return DtoMapper.toFollowRequestDto(saved);
    }

    @Transactional
    public void acceptFollowRequest(Long requestId) {
        User receiver = securityUtils.getCurrentUser();
        FollowRequest request = followRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Follow request not found"));
        if (!request.getReceiver().getId().equals(receiver.getId())) {
            throw new ForbiddenException("Not authorized to accept this request");
        }
        addFollowRelationship(request.getSender(), receiver);
        followRequestRepository.delete(request);
        notificationService.createNotification(request.getSender(), receiver, NotificationType.FOLLOW,
                receiver.getUsername() + " accepted your follow request", receiver.getId());
    }

    @Transactional
    public void rejectFollowRequest(Long requestId) {
        User receiver = securityUtils.getCurrentUser();
        FollowRequest request = followRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Follow request not found"));
        if (!request.getReceiver().getId().equals(receiver.getId())) {
            throw new ForbiddenException("Not authorized to reject this request");
        }
        followRequestRepository.delete(request);
    }

    @Transactional
    public void unfollow(String targetUsername) {
        User current = securityUtils.getCurrentUser();
        User target = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUsername));
        current.getFollowing().remove(target);
        target.getFollowers().remove(current);
        userRepository.save(current);
        userRepository.save(target);
    }

    @Transactional(readOnly = true)
    public List<FollowRequestDto> getPendingRequests() {
        User current = securityUtils.getCurrentUser();
        return followRequestRepository.findByReceiver(current).stream()
                .map(DtoMapper::toFollowRequestDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserProfileDto> getFollowers(String username) {
        User viewer = securityUtils.getCurrentUser();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return user.getFollowers().stream()
                .map(f -> DtoMapper.toUserProfile(f, viewer))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserProfileDto> getFollowing(String username) {
        User viewer = securityUtils.getCurrentUser();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return user.getFollowing().stream()
                .map(f -> DtoMapper.toUserProfile(f, viewer))
                .collect(Collectors.toList());
    }

    private void addFollowRelationship(User follower, User followed) {
        follower.getFollowing().add(followed);
        followed.getFollowers().add(follower);
        userRepository.save(follower);
        userRepository.save(followed);
    }
}
