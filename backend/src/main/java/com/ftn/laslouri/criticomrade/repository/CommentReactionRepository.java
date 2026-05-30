package com.ftn.laslouri.criticomrade.repository;

import com.ftn.laslouri.criticomrade.model.Comment;
import com.ftn.laslouri.criticomrade.model.CommentReaction;
import com.ftn.laslouri.criticomrade.model.ReactionType;
import com.ftn.laslouri.criticomrade.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {

    List<CommentReaction> findByComment(Comment comment);

    Optional<CommentReaction> findByUserAndComment(User user, Comment comment);

    long countByCommentAndReactionType(Comment comment, ReactionType reactionType);

    boolean existsByUserAndCommentAndReactionType(User user, Comment comment, ReactionType reactionType);
}
