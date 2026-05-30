package com.ftn.laslouri.criticomrade.controller;

import com.ftn.laslouri.criticomrade.dto.ReactionSummaryDto;
import com.ftn.laslouri.criticomrade.dto.ReactionToggleRequest;
import com.ftn.laslouri.criticomrade.service.ReactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reactions")
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionService reactionService;

    @PostMapping("/{targetType}/{targetId}")
    public List<ReactionSummaryDto> toggle(
            @PathVariable String targetType,
            @PathVariable Long targetId,
            @Valid @RequestBody ReactionToggleRequest request) {
        return reactionService.toggleReaction(targetType, targetId, request);
    }

    @GetMapping("/movie/{movieId}")
    public List<ReactionSummaryDto> getMovieReactions(@PathVariable Long movieId) {
        return reactionService.getMovieReactions(movieId);
    }

    @GetMapping("/review/{reviewId}")
    public List<ReactionSummaryDto> getReviewReactions(@PathVariable Long reviewId) {
        return reactionService.getReviewReactions(reviewId);
    }
}
