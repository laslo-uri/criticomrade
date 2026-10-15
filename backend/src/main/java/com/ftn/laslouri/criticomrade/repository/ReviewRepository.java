package com.ftn.laslouri.criticomrade.repository;

import com.ftn.laslouri.criticomrade.model.Review;
import com.ftn.laslouri.criticomrade.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByUserOrderByReviewTimeDesc(User user, Pageable pageable);

    @Query("SELECT r FROM Review r WHERE r.user IN :users ORDER BY r.reviewTime DESC")
    Page<Review> findFeedForUsers(@Param("users") List<User> users, Pageable pageable);

    long countByUser(User user);

    List<Review> findByUser(User user);

    Page<Review> findByMovieIdOrderByReviewTimeDesc(Long movieId, Pageable pageable);
}
