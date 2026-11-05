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

    /** Reviews on a title, leaving out private profiles the viewer does not follow. */
    @Query("""
            SELECT r FROM Review r JOIN r.user u
            WHERE r.movie.id = :movieId
              AND (u.isProfilePublic = true OR u.id = :viewerId
                   OR EXISTS (SELECT 1 FROM User f JOIN f.following t WHERE f.id = :viewerId AND t.id = u.id))
            ORDER BY r.reviewTime DESC
            """)
    Page<Review> findVisibleForMovie(@Param("movieId") Long movieId, @Param("viewerId") Long viewerId, Pageable pageable);
}
