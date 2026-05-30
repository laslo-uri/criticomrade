package com.ftn.laslouri.criticomrade.service;

import com.ftn.laslouri.criticomrade.dto.PageResponse;
import com.ftn.laslouri.criticomrade.dto.ReviewCreateRequest;
import com.ftn.laslouri.criticomrade.dto.ReviewDto;
import com.ftn.laslouri.criticomrade.exception.ForbiddenException;
import com.ftn.laslouri.criticomrade.exception.ResourceNotFoundException;
import com.ftn.laslouri.criticomrade.mapper.DtoMapper;
import com.ftn.laslouri.criticomrade.model.Movie;
import com.ftn.laslouri.criticomrade.model.Review;
import com.ftn.laslouri.criticomrade.model.User;
import com.ftn.laslouri.criticomrade.repository.CommentRepository;
import com.ftn.laslouri.criticomrade.repository.ReviewReactionRepository;
import com.ftn.laslouri.criticomrade.repository.ReviewRepository;
import com.ftn.laslouri.criticomrade.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CommentRepository commentRepository;
    private final ReviewReactionRepository reviewReactionRepository;
    private final MovieService movieService;
    private final UserService userService;
    private final SecurityUtils securityUtils;

    @Transactional
    public ReviewDto createReview(ReviewCreateRequest request) {
        User user = securityUtils.getCurrentUser();
        Movie movie = movieService.findOrFetchEntity(request.getTmdbId());
        LocalDateTime now = LocalDateTime.now();

        Review review = new Review();
        review.setUser(user);
        review.setMovie(movie);
        review.setRating(request.getRating());
        review.setText(request.getText());
        review.setDateWatched(request.getDateWatched());
        review.setSeenBefore(request.isSeenBefore());
        review.setContainedSpoiler(request.isSpoiler());
        review.setReviewTime(now);
        review.setLastUpdated(now);

        Review saved = reviewRepository.save(review);
        return toDto(saved, user);
    }

    @Transactional(readOnly = true)
    public ReviewDto getReview(Long id) {
        User viewer = securityUtils.getCurrentUser();
        Review review = findReview(id);
        return toDto(review, viewer);
    }

    @Transactional
    public ReviewDto updateReview(Long id, ReviewCreateRequest request) {
        User user = securityUtils.getCurrentUser();
        Review review = findReview(id);
        if (!review.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Not authorized to update this review");
        }
        if (request.getRating() != null) {
            review.setRating(request.getRating());
        }
        if (request.getText() != null) {
            review.setText(request.getText());
        }
        review.setDateWatched(request.getDateWatched());
        review.setSeenBefore(request.isSeenBefore());
        review.setContainedSpoiler(request.isSpoiler());
        review.setLastUpdated(LocalDateTime.now());
        return toDto(reviewRepository.save(review), user);
    }

    @Transactional
    public void deleteReview(Long id) {
        User user = securityUtils.getCurrentUser();
        Review review = findReview(id);
        if (!review.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Not authorized to delete this review");
        }
        reviewRepository.delete(review);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReviewDto> getFeed(int page, int size) {
        User viewer = securityUtils.getCurrentUser();
        List<User> feedUsers = new ArrayList<>(viewer.getFollowing());
        feedUsers.add(viewer);
        Page<Review> reviews = reviewRepository.findFeedForUsers(feedUsers, PageRequest.of(page, size));
        Page<ReviewDto> mapped = reviews.map(r -> toDto(r, viewer));
        return DtoMapper.toPageResponse(mapped);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReviewDto> getUserReviews(String username, int page, int size) {
        User viewer = securityUtils.getCurrentUser();
        User user = userService.findByUsername(username);
        Page<Review> reviews = reviewRepository.findByUserOrderByReviewTimeDesc(user, PageRequest.of(page, size));
        Page<ReviewDto> mapped = reviews.map(r -> toDto(r, viewer));
        return DtoMapper.toPageResponse(mapped);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReviewDto> getMovieReviews(Long movieId, int page, int size) {
        User viewer = securityUtils.getCurrentUser();
        movieService.findEntityById(movieId);
        Page<Review> reviews = reviewRepository.findByMovieIdOrderByReviewTimeDesc(movieId, PageRequest.of(page, size));
        Page<ReviewDto> mapped = reviews.map(r -> toDto(r, viewer));
        return DtoMapper.toPageResponse(mapped);
    }

    public Review findReview(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found: " + id));
    }

    private ReviewDto toDto(Review review, User viewer) {
        long commentCount = commentRepository.countByReview(review);
        var reactions = DtoMapper.summarizeReactions(
                reviewReactionRepository.findByReview(review).stream()
                        .collect(java.util.stream.Collectors.toSet()),
                viewer);
        return DtoMapper.toReviewDto(review, viewer, reactions, commentCount);
    }
}
