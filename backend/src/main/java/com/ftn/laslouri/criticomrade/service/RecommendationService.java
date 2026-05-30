package com.ftn.laslouri.criticomrade.service;

import com.ftn.laslouri.criticomrade.dto.RecommendationCreateRequest;
import com.ftn.laslouri.criticomrade.dto.RecommendationDto;
import com.ftn.laslouri.criticomrade.exception.BadRequestException;
import com.ftn.laslouri.criticomrade.exception.ForbiddenException;
import com.ftn.laslouri.criticomrade.exception.ResourceNotFoundException;
import com.ftn.laslouri.criticomrade.mapper.DtoMapper;
import com.ftn.laslouri.criticomrade.model.*;
import com.ftn.laslouri.criticomrade.repository.RecommendationRepository;
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
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final MovieService movieService;
    private final NotificationService notificationService;
    private final SecurityUtils securityUtils;

    @Transactional
    public RecommendationDto create(RecommendationCreateRequest request) {
        User fromUser = securityUtils.getCurrentUser();
        User toUser = userService.findByUsername(request.getToUsername());
        if (fromUser.getId().equals(toUser.getId())) {
            throw new BadRequestException("Cannot recommend to yourself");
        }
        Movie movie = movieService.findOrFetchEntity(request.getTmdbId());
        LocalDateTime now = LocalDateTime.now();

        Recommendation recommendation = new Recommendation();
        recommendation.setFromUser(fromUser);
        recommendation.setToUser(toUser);
        recommendation.setMovie(movie);
        recommendation.setStatus(RecommendationStatus.PENDING);
        recommendation.setCreationTime(now);
        recommendation.setChallengeDurationDays(request.getChallengeDurationDays());
        recommendation.setEndTime(now.plusDays(request.getChallengeDurationDays()));
        recommendation.setChallengePoints(request.getChallengePoints());

        Recommendation saved = recommendationRepository.save(recommendation);
        notificationService.createNotification(toUser, fromUser, NotificationType.RECOMMENDATION,
                fromUser.getUsername() + " recommended " + movie.getTitle(), saved.getId());
        return DtoMapper.toRecommendationDto(saved, fromUser);
    }

    @Transactional(readOnly = true)
    public List<RecommendationDto> getIncoming() {
        User user = securityUtils.getCurrentUser();
        return recommendationRepository.findByToUserOrderByCreationTimeDesc(user).stream()
                .map(r -> DtoMapper.toRecommendationDto(r, user))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RecommendationDto> getOutgoing() {
        User user = securityUtils.getCurrentUser();
        return recommendationRepository.findByFromUserOrderByCreationTimeDesc(user).stream()
                .map(r -> DtoMapper.toRecommendationDto(r, user))
                .collect(Collectors.toList());
    }

    @Transactional
    public RecommendationDto accept(Long id) {
        User user = securityUtils.getCurrentUser();
        Recommendation recommendation = findRecommendation(id);
        if (!recommendation.getToUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Not authorized");
        }
        recommendation.setStatus(RecommendationStatus.ACCEPTED);
        return DtoMapper.toRecommendationDto(recommendationRepository.save(recommendation), user);
    }

    @Transactional
    public RecommendationDto reject(Long id) {
        User user = securityUtils.getCurrentUser();
        Recommendation recommendation = findRecommendation(id);
        if (!recommendation.getToUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Not authorized");
        }
        recommendation.setStatus(RecommendationStatus.REJECTED);
        return DtoMapper.toRecommendationDto(recommendationRepository.save(recommendation), user);
    }

    @Transactional
    public RecommendationDto complete(Long id) {
        User user = securityUtils.getCurrentUser();
        Recommendation recommendation = findRecommendation(id);
        if (!recommendation.getToUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Not authorized");
        }
        recommendation.setStatus(RecommendationStatus.COMPLETED);
        Recommendation saved = recommendationRepository.save(recommendation);
        User fromUser = saved.getFromUser();
        fromUser.setGainedChallengePoints(fromUser.getGainedChallengePoints() + saved.getChallengePoints());
        userRepository.save(fromUser);
        notificationService.createNotification(fromUser, user, NotificationType.CHALLENGE_COMPLETED,
                user.getUsername() + " completed your movie challenge", saved.getId());
        return DtoMapper.toRecommendationDto(saved, user);
    }

    private Recommendation findRecommendation(Long id) {
        return recommendationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recommendation not found: " + id));
    }
}
