package com.ftn.laslouri.criticomrade.repository;

import com.ftn.laslouri.criticomrade.model.ReactionType;
import com.ftn.laslouri.criticomrade.model.Review;
import com.ftn.laslouri.criticomrade.model.ReviewReaction;
import com.ftn.laslouri.criticomrade.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewReactionRepository extends JpaRepository<ReviewReaction, Long> {

    List<ReviewReaction> findByReview(Review review);

    Optional<ReviewReaction> findByUserAndReview(User user, Review review);

    long countByReviewAndReactionType(Review review, ReactionType reactionType);

    boolean existsByUserAndReviewAndReactionType(User user, Review review, ReactionType reactionType);
}
