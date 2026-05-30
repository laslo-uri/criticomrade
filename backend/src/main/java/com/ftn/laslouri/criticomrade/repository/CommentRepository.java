package com.ftn.laslouri.criticomrade.repository;

import com.ftn.laslouri.criticomrade.model.Comment;
import com.ftn.laslouri.criticomrade.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByReviewOrderByCommentTimeAsc(Review review);

    Page<Comment> findByReview(Review review, Pageable pageable);

    long countByReview(Review review);
}
