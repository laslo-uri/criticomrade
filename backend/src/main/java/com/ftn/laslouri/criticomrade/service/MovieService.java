package com.ftn.laslouri.criticomrade.service;

import com.ftn.laslouri.criticomrade.dto.MovieDto;
import com.ftn.laslouri.criticomrade.exception.BadRequestException;
import com.ftn.laslouri.criticomrade.exception.ResourceNotFoundException;
import com.ftn.laslouri.criticomrade.mapper.DtoMapper;
import com.ftn.laslouri.criticomrade.model.Movie;
import com.ftn.laslouri.criticomrade.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;
    private final RestTemplate restTemplate;

    @Value("${criticomrade.tmdb.api-key}")
    private String tmdbApiKey;

    @Value("${criticomrade.tmdb.base-url}")
    private String tmdbBaseUrl;

    @Transactional(readOnly = true)
    public MovieDto getById(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found: " + id));
        return DtoMapper.toMovieDto(movie);
    }

    @Transactional(readOnly = true)
    public Movie findEntityById(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found: " + id));
    }

    @Transactional
    public MovieDto getOrFetchByTmdbId(Long tmdbId) {
        return movieRepository.findByTmdbId(tmdbId)
                .map(DtoMapper::toMovieDto)
                .orElseGet(() -> DtoMapper.toMovieDto(fetchAndSaveFromTmdb(tmdbId)));
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<MovieDto> searchTmdb(String query) {
        if (tmdbApiKey == null || tmdbApiKey.isBlank()) {
            throw new BadRequestException("TMDB API key is not configured");
        }
        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl + "/search/movie")
                .queryParam("api_key", tmdbApiKey)
                .queryParam("query", query)
                .toUriString();
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null || !response.containsKey("results")) {
            return List.of();
        }
        List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
        List<MovieDto> movies = new ArrayList<>();
        for (Map<String, Object> item : results) {
            movies.add(mapTmdbResult(item));
        }
        return movies;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<MovieDto> getPopular() {
        if (tmdbApiKey == null || tmdbApiKey.isBlank()) {
            throw new BadRequestException("TMDB API key is not configured");
        }
        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl + "/movie/popular")
                .queryParam("api_key", tmdbApiKey)
                .toUriString();
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null || !response.containsKey("results")) {
            return List.of();
        }
        List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
        List<MovieDto> movies = new ArrayList<>();
        for (Map<String, Object> item : results) {
            movies.add(mapTmdbResult(item));
        }
        return movies;
    }

    @Transactional
    public Movie findOrFetchEntity(Long tmdbId) {
        return movieRepository.findByTmdbId(tmdbId)
                .orElseGet(() -> fetchAndSaveFromTmdb(tmdbId));
    }

    @SuppressWarnings("unchecked")
    private Movie fetchAndSaveFromTmdb(Long tmdbId) {
        if (tmdbApiKey == null || tmdbApiKey.isBlank()) {
            throw new BadRequestException("TMDB API key is not configured");
        }
        String url = UriComponentsBuilder.fromHttpUrl(tmdbBaseUrl + "/movie/" + tmdbId)
                .queryParam("api_key", tmdbApiKey)
                .toUriString();
        Map<String, Object> data = restTemplate.getForObject(url, Map.class);
        if (data == null) {
            throw new ResourceNotFoundException("TMDB movie not found: " + tmdbId);
        }

        Movie movie = new Movie();
        movie.setTmdbId(tmdbId);
        movie.setTitle((String) data.get("title"));
        movie.setDescription((String) data.get("overview"));
        if (data.get("release_date") != null) {
            String releaseDate = (String) data.get("release_date");
            movie.setYear(releaseDate.length() >= 4 ? releaseDate.substring(0, 4) : releaseDate);
        }
        if (data.get("poster_path") != null) {
            movie.setPosterApiLink("https://image.tmdb.org/t/p/w500" + data.get("poster_path"));
        }
        if (data.get("genres") instanceof List<?> genres) {
            movie.setGenre(genres.stream()
                    .filter(Map.class::isInstance)
                    .map(g -> (String) ((Map<?, ?>) g).get("name"))
                    .reduce((a, b) -> a + ", " + b)
                    .orElse(null));
        }
        if (data.get("vote_average") instanceof Number vote) {
            movie.setImdbRating(vote.doubleValue());
        }
        return movieRepository.save(movie);
    }

    private MovieDto mapTmdbResult(Map<String, Object> item) {
        Long tmdbId = item.get("id") instanceof Number n ? n.longValue() : null;
        String posterPath = item.get("poster_path") != null
                ? "https://image.tmdb.org/t/p/w500" + item.get("poster_path") : null;
        String year = null;
        if (item.get("release_date") instanceof String releaseDate && releaseDate.length() >= 4) {
            year = releaseDate.substring(0, 4);
        }
        Double rating = item.get("vote_average") instanceof Number n ? n.doubleValue() : null;
        return MovieDto.builder()
                .tmdbId(tmdbId)
                .title((String) item.get("title"))
                .description((String) item.get("overview"))
                .year(year)
                .posterApiLink(posterPath)
                .imdbRating(rating)
                .build();
    }
}
