package com.ftn.laslouri.criticomrade.controller;

import com.ftn.laslouri.criticomrade.dto.PageResponse;
import com.ftn.laslouri.criticomrade.dto.ReviewCreateRequest;
import com.ftn.laslouri.criticomrade.dto.ReviewDto;
import com.ftn.laslouri.criticomrade.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/api/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewDto create(@Valid @RequestBody ReviewCreateRequest request) {
        return reviewService.createReview(request);
    }

    @GetMapping("/api/reviews/{id}")
    public ReviewDto getById(@PathVariable Long id) {
        return reviewService.getReview(id);
    }

    @PutMapping("/api/reviews/{id}")
    public ReviewDto update(@PathVariable Long id, @Valid @RequestBody ReviewCreateRequest request) {
        return reviewService.updateReview(id, request);
    }

    @DeleteMapping("/api/reviews/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        reviewService.deleteReview(id);
    }

    @GetMapping("/api/feed")
    public PageResponse<ReviewDto> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return reviewService.getFeed(page, size);
    }

    @GetMapping("/api/users/{username}/reviews")
    public PageResponse<ReviewDto> getUserReviews(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return reviewService.getUserReviews(username, page, size);
    }
}
