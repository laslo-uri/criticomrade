package com.ftn.laslouri.criticomrade.controller;

import com.ftn.laslouri.criticomrade.dto.MovieDto;
import com.ftn.laslouri.criticomrade.dto.PageResponse;
import com.ftn.laslouri.criticomrade.dto.ReviewDto;
import com.ftn.laslouri.criticomrade.service.MovieService;
import com.ftn.laslouri.criticomrade.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;
    private final ReviewService reviewService;

    @GetMapping("/{id}")
    public MovieDto getById(@PathVariable Long id) {
        return movieService.getById(id);
    }

    @GetMapping("/tmdb/{tmdbId}")
    public MovieDto getByTmdbId(@PathVariable Long tmdbId) {
        return movieService.getOrFetchByTmdbId(tmdbId);
    }

    @GetMapping("/search")
    public List<MovieDto> search(@RequestParam String q) {
        return movieService.searchTmdb(q);
    }

    @GetMapping("/popular")
    public List<MovieDto> popular() {
        return movieService.getPopular();
    }

    @GetMapping("/{id}/reviews")
    public PageResponse<ReviewDto> getReviews(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return reviewService.getMovieReviews(id, page, size);
    }
}
