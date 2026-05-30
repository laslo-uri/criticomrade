package com.ftn.laslouri.criticomrade.controller;

import com.ftn.laslouri.criticomrade.dto.CommentCreateRequest;
import com.ftn.laslouri.criticomrade.dto.CommentDto;
import com.ftn.laslouri.criticomrade.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping("/reviews/{reviewId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentDto create(@PathVariable Long reviewId, @Valid @RequestBody CommentCreateRequest request) {
        return commentService.createComment(reviewId, request);
    }

    @GetMapping("/reviews/{reviewId}/comments")
    public List<CommentDto> list(@PathVariable Long reviewId) {
        return commentService.getCommentsForReview(reviewId);
    }

    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long commentId) {
        commentService.deleteComment(commentId);
    }
}
