package com.ftn.laslouri.criticomrade.repository;

import com.ftn.laslouri.criticomrade.model.Movie;
import com.ftn.laslouri.criticomrade.model.MovieReaction;
import com.ftn.laslouri.criticomrade.model.ReactionType;
import com.ftn.laslouri.criticomrade.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MovieReactionRepository extends JpaRepository<MovieReaction, Long> {

    List<MovieReaction> findByMovie(Movie movie);

    Optional<MovieReaction> findByUserAndMovie(User user, Movie movie);

    long countByMovieAndReactionType(Movie movie, ReactionType reactionType);

    boolean existsByUserAndMovieAndReactionType(User user, Movie movie, ReactionType reactionType);
}
