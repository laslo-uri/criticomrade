package com.ftn.laslouri.criticomrade.service;

import com.ftn.laslouri.criticomrade.dto.ReactionSummaryDto;
import com.ftn.laslouri.criticomrade.dto.ReactionToggleRequest;
import com.ftn.laslouri.criticomrade.exception.BadRequestException;
import com.ftn.laslouri.criticomrade.model.*;
import com.ftn.laslouri.criticomrade.repository.CommentReactionRepository;
import com.ftn.laslouri.criticomrade.repository.MovieReactionRepository;
import com.ftn.laslouri.criticomrade.repository.ReviewReactionRepository;
import com.ftn.laslouri.criticomrade.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReactionService {

    private final MovieReactionRepository movieReactionRepository;
    private final ReviewReactionRepository reviewReactionRepository;
    private final CommentReactionRepository commentReactionRepository;
    private final MovieService movieService;
    private final ReviewService reviewService;
    private final CommentService commentService;
    private final NotificationService notificationService;
    private final SecurityUtils securityUtils;

    @Transactional
    public List<ReactionSummaryDto> toggleReaction(String targetType, Long targetId, ReactionToggleRequest request) {
        User user = securityUtils.getCurrentUser();
        ReactionType type = request.getReactionType();

        return switch (targetType.toUpperCase()) {
            case "MOVIE" -> toggleMovieReaction(user, targetId, type);
            case "REVIEW" -> toggleReviewReaction(user, targetId, type);
            case "COMMENT" -> toggleCommentReaction(user, targetId, type);
            default -> throw new BadRequestException("Unknown target type: " + targetType);
        };
    }

    private List<ReactionSummaryDto> toggleMovieReaction(User user, Long movieId, ReactionType type) {
        Movie movie = movieService.findEntityById(movieId);
        var existing = movieReactionRepository.findByUserAndMovie(user, movie);
        if (existing.isPresent()) {
            MovieReaction reaction = existing.get();
            if (reaction.getReactionType() == type) {
                movieReactionRepository.delete(reaction);
            } else {
                reaction.setReactionType(type);
                reaction.setReactionTime(LocalDateTime.now());
                movieReactionRepository.save(reaction);
            }
        } else {
            MovieReaction reaction = new MovieReaction();
            reaction.setUser(user);
            reaction.setMovie(movie);
            reaction.setReactionType(type);
            reaction.setReactionTime(LocalDateTime.now());
            movieReactionRepository.save(reaction);
        }
        return summarizeMovieReactions(movie, user);
    }

    private List<ReactionSummaryDto> toggleReviewReaction(User user, Long reviewId, ReactionType type) {
        Review review = reviewService.findReview(reviewId);
        var existing = reviewReactionRepository.findByUserAndReview(user, review);
        if (existing.isPresent()) {
            ReviewReaction reaction = existing.get();
            if (reaction.getReactionType() == type) {
                reviewReactionRepository.delete(reaction);
            } else {
                reaction.setReactionType(type);
                reaction.setReactionTime(LocalDateTime.now());
                reviewReactionRepository.save(reaction);
            }
        } else {
            ReviewReaction reaction = new ReviewReaction();
            reaction.setUser(user);
            reaction.setReview(review);
            reaction.setReactionType(type);
            reaction.setReactionTime(LocalDateTime.now());
            reviewReactionRepository.save(reaction);
            if (!review.getUser().getId().equals(user.getId())) {
                notificationService.createNotification(review.getUser(), user, NotificationType.REACTION,
                        user.getUsername() + " reacted to your review", review.getId());
            }
        }
        return summarizeReviewReactions(review, user);
    }

    private List<ReactionSummaryDto> toggleCommentReaction(User user, Long commentId, ReactionType type) {
        Comment comment = commentService.findComment(commentId);
        var existing = commentReactionRepository.findByUserAndComment(user, comment);
        if (existing.isPresent()) {
            CommentReaction reaction = existing.get();
            if (reaction.getReactionType() == type) {
                commentReactionRepository.delete(reaction);
            } else {
                reaction.setReactionType(type);
                reaction.setReactionTime(LocalDateTime.now());
                commentReactionRepository.save(reaction);
            }
        } else {
            CommentReaction reaction = new CommentReaction();
            reaction.setUser(user);
            reaction.setComment(comment);
            reaction.setReactionType(type);
            reaction.setReactionTime(LocalDateTime.now());
            commentReactionRepository.save(reaction);
            if (!comment.getUser().getId().equals(user.getId())) {
                notificationService.createNotification(comment.getUser(), user, NotificationType.REACTION,
                        user.getUsername() + " reacted to your comment", comment.getId());
            }
        }
        return summarizeCommentReactions(comment, user);
    }

    @Transactional(readOnly = true)
    public List<ReactionSummaryDto> getMovieReactions(Long movieId) {
        User viewer = securityUtils.getCurrentUser();
        Movie movie = movieService.findEntityById(movieId);
        return summarizeMovieReactions(movie, viewer);
    }

    @Transactional(readOnly = true)
    public List<ReactionSummaryDto> getReviewReactions(Long reviewId) {
        User viewer = securityUtils.getCurrentUser();
        Review review = reviewService.findReview(reviewId);
        return summarizeReviewReactions(review, viewer);
    }

    private List<ReactionSummaryDto> summarizeMovieReactions(Movie movie, User viewer) {
        return movieReactionRepository.findByMovie(movie).stream()
                .collect(Collectors.groupingBy(Reaction::getReactionType, Collectors.counting()))
                .entrySet().stream()
                .map(e -> ReactionSummaryDto.builder()
                        .type(e.getKey())
                        .count(e.getValue())
                        .reactedByCurrentUser(movieReactionRepository.existsByUserAndMovieAndReactionType(
                                viewer, movie, e.getKey()))
                        .build())
                .collect(Collectors.toList());
    }

    private List<ReactionSummaryDto> summarizeReviewReactions(Review review, User viewer) {
        return reviewReactionRepository.findByReview(review).stream()
                .collect(Collectors.groupingBy(Reaction::getReactionType, Collectors.counting()))
                .entrySet().stream()
                .map(e -> ReactionSummaryDto.builder()
                        .type(e.getKey())
                        .count(e.getValue())
                        .reactedByCurrentUser(reviewReactionRepository.existsByUserAndReviewAndReactionType(
                                viewer, review, e.getKey()))
                        .build())
                .collect(Collectors.toList());
    }

    private List<ReactionSummaryDto> summarizeCommentReactions(Comment comment, User viewer) {
        return commentReactionRepository.findByComment(comment).stream()
                .collect(Collectors.groupingBy(Reaction::getReactionType, Collectors.counting()))
                .entrySet().stream()
                .map(e -> ReactionSummaryDto.builder()
                        .type(e.getKey())
                        .count(e.getValue())
                        .reactedByCurrentUser(commentReactionRepository.existsByUserAndCommentAndReactionType(
                                viewer, comment, e.getKey()))
                        .build())
                .collect(Collectors.toList());
    }
}
