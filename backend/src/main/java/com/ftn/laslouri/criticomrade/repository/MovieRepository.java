package com.ftn.laslouri.criticomrade.repository;

import com.ftn.laslouri.criticomrade.model.Movie;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MovieRepository extends JpaRepository<Movie, Long> {

    Optional<Movie> findByTmdbId(Long tmdbId);
}
