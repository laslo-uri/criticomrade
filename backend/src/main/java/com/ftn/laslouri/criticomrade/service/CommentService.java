package com.ftn.laslouri.criticomrade.service;

import com.ftn.laslouri.criticomrade.dto.CommentCreateRequest;
import com.ftn.laslouri.criticomrade.dto.CommentDto;
import com.ftn.laslouri.criticomrade.dto.ReactionSummaryDto;
import com.ftn.laslouri.criticomrade.exception.ForbiddenException;
import com.ftn.laslouri.criticomrade.exception.ResourceNotFoundException;
import com.ftn.laslouri.criticomrade.mapper.DtoMapper;
import com.ftn.laslouri.criticomrade.model.Comment;
import com.ftn.laslouri.criticomrade.model.NotificationType;
import com.ftn.laslouri.criticomrade.model.Review;
import com.ftn.laslouri.criticomrade.model.User;
import com.ftn.laslouri.criticomrade.repository.CommentReactionRepository;
import com.ftn.laslouri.criticomrade.repository.CommentRepository;
import com.ftn.laslouri.criticomrade.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentReactionRepository commentReactionRepository;
    private final ReviewService reviewService;
    private final NotificationService notificationService;
    private final SecurityUtils securityUtils;

    @Transactional
    public CommentDto createComment(Long reviewId, CommentCreateRequest request) {
        User user = securityUtils.getCurrentUser();
        Review review = reviewService.findReview(reviewId);

        Comment comment = new Comment();
        comment.setReview(review);
        comment.setUser(user);
        comment.setText(request.getText());
        comment.setCommentTime(LocalDateTime.now());

        Comment saved = commentRepository.save(comment);
        if (!review.getUser().getId().equals(user.getId())) {
            notificationService.createNotification(review.getUser(), user, NotificationType.COMMENT,
                    user.getUsername() + " commented on your review", saved.getId());
        }
        return toDto(saved, user);
    }

    @Transactional(readOnly = true)
    public List<CommentDto> getCommentsForReview(Long reviewId) {
        User viewer = securityUtils.getCurrentUser();
        Review review = reviewService.findReview(reviewId);
        return commentRepository.findByReviewOrderByCommentTimeAsc(review).stream()
                .map(c -> toDto(c, viewer))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteComment(Long commentId) {
        User user = securityUtils.getCurrentUser();
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + commentId));
        if (!comment.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Not authorized to delete this comment");
        }
        commentRepository.delete(comment);
    }

    public Comment findComment(Long id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + id));
    }

    private CommentDto toDto(Comment comment, User viewer) {
        List<ReactionSummaryDto> reactions = DtoMapper.summarizeReactions(
                commentReactionRepository.findByComment(comment).stream()
                        .collect(Collectors.toSet()),
                viewer);
        return DtoMapper.toCommentDto(comment, viewer, reactions);
    }
}
