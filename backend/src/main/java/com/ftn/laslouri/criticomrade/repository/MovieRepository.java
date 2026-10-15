package com.ftn.laslouri.criticomrade.repository;

import com.ftn.laslouri.criticomrade.model.Movie;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MovieRepository extends JpaRepository<Movie, Long> {

    Optional<Movie> findByTmdbId(Long tmdbId);

    Optional<Movie> findByExternalKey(String externalKey);

    @Query("""
            SELECT m FROM Movie m
            WHERE LOWER(m.genre) LIKE LOWER(CONCAT('%', :genre, '%'))
            AND m.id NOT IN (
                SELECT r.movie.id FROM Review r
                WHERE r.user.id = :userId AND r.movie IS NOT NULL
            )
            ORDER BY m.imdbRating DESC
            """)
    List<Movie> findSimilar(@Param("genre") String genre, @Param("userId") Long userId, Pageable pageable);
}
