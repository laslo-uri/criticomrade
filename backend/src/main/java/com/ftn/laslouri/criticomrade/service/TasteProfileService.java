package com.ftn.laslouri.criticomrade.service;

import com.ftn.laslouri.criticomrade.dto.CompatibilityDto;
import com.ftn.laslouri.criticomrade.dto.DiaryStatsDto;
import com.ftn.laslouri.criticomrade.dto.GenreShareDto;
import com.ftn.laslouri.criticomrade.dto.MovieDto;
import com.ftn.laslouri.criticomrade.dto.TasteProfileDto;
import com.ftn.laslouri.criticomrade.mapper.DtoMapper;
import com.ftn.laslouri.criticomrade.model.MediaType;
import com.ftn.laslouri.criticomrade.model.Review;
import com.ftn.laslouri.criticomrade.model.User;
import com.ftn.laslouri.criticomrade.repository.MovieRepository;
import com.ftn.laslouri.criticomrade.repository.ReviewRepository;
import com.ftn.laslouri.criticomrade.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TasteProfileService {

    private final ReviewRepository reviewRepository;
    private final MovieRepository movieRepository;
    private final UserService userService;
    private final SecurityUtils securityUtils;

    @Transactional(readOnly = true)
    public TasteProfileDto tasteProfile(String username) {
        User user = userService.findByUsername(username);
        List<Review> reviews = reviewRepository.findByUser(user);
        Map<String, Integer> genres = new HashMap<>();
        Map<String, Integer> types = new HashMap<>();
        int rated = 0;
        int ratingSum = 0;
        for (Review review : reviews) {
            if (review.getMovie() == null) {
                continue;
            }
            MediaType type = review.getMovie().getMediaType() == null ? MediaType.FILM : review.getMovie().getMediaType();
            types.merge(type.name(), 1, Integer::sum);
            if (review.getRating() != null) {
                rated++;
                ratingSum += review.getRating();
            }
            if (review.getMovie().getGenre() != null) {
                for (String genre : review.getMovie().getGenre().split(",")) {
                    String name = genre.trim();
                    if (!name.isEmpty()) {
                        genres.merge(name, 1, Integer::sum);
                    }
                }
            }
        }
        return TasteProfileDto.builder()
                .ratedCount(reviews.size())
                .averageRating(rated == 0 ? 0 : Math.round((ratingSum / 2.0 / rated) * 10.0) / 10.0)
                .genres(shares(genres))
                .mediaTypes(shares(types))
                .build();
    }

    @Transactional(readOnly = true)
    public DiaryStatsDto diaryStats(String username) {
        User user = userService.findByUsername(username);
        List<Review> reviews = reviewRepository.findByUser(user);
        int[] buckets = new int[5];
        Map<String, Integer> types = new HashMap<>();
        Map<String, Integer> yearGenres = new HashMap<>();
        int year = Year.now().getValue();
        int yearCount = 0;
        int yearRated = 0;
        int yearSum = 0;
        for (Review review : reviews) {
            if (review.getMovie() != null) {
                MediaType type = review.getMovie().getMediaType() == null ? MediaType.FILM : review.getMovie().getMediaType();
                types.merge(type.name(), 1, Integer::sum);
            }
            if (review.getRating() != null) {
                int stars = Math.max(1, Math.min(5, (int) Math.round(review.getRating() / 2.0)));
                buckets[stars - 1]++;
            }
            LocalDate watched = review.getDateWatched();
            if (watched != null && watched.getYear() == year) {
                yearCount++;
                if (review.getRating() != null) {
                    yearRated++;
                    yearSum += review.getRating();
                }
                if (review.getMovie() != null && review.getMovie().getGenre() != null) {
                    String name = review.getMovie().getGenre().split(",")[0].trim();
                    if (!name.isEmpty()) {
                        yearGenres.merge(name, 1, Integer::sum);
                    }
                }
            }
        }
        String topGenre = yearGenres.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
        return DiaryStatsDto.builder()
                .year(year)
                .yearCount(yearCount)
                .yearAverage(yearRated == 0 ? 0 : Math.round((yearSum / 2.0 / yearRated) * 10.0) / 10.0)
                .topGenre(topGenre)
                .distribution(Arrays.stream(buckets).boxed().toList())
                .mediaTypes(shares(types))
                .build();
    }

    @Transactional(readOnly = true)
    public List<MovieDto> suggestions() {
        User viewer = securityUtils.getCurrentUser();
        String genre = null;
        int best = -1;
        for (Review review : reviewRepository.findByUser(viewer)) {
            if (review.getRating() == null || review.getMovie() == null || review.getMovie().getGenre() == null) {
                continue;
            }
            if (review.getRating() >= best) {
                best = review.getRating();
                String name = review.getMovie().getGenre().split(",")[0].trim();
                if (!name.isEmpty()) {
                    genre = name;
                }
            }
        }
        if (genre == null) {
            return List.of();
        }
        return movieRepository.findSimilar(genre, viewer.getId(), PageRequest.of(0, 12)).stream()
                .map(DtoMapper::toMovieDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public CompatibilityDto compatibility(String username) {
        User viewer = securityUtils.getCurrentUser();
        User other = userService.findByUsername(username);
        Map<Long, Integer> mine = ratingsByMovie(reviewRepository.findByUser(viewer));
        Map<Long, Integer> theirs = ratingsByMovie(reviewRepository.findByUser(other));
        int shared = 0;
        double distance = 0;
        for (Map.Entry<Long, Integer> entry : mine.entrySet()) {
            Integer otherRating = theirs.get(entry.getKey());
            if (otherRating == null) {
                continue;
            }
            shared++;
            distance += Math.abs(entry.getValue() - otherRating) / 10.0;
        }
        Integer percent = shared == 0 ? null : (int) Math.round((1 - (distance / shared)) * 100);
        return CompatibilityDto.builder().sharedCount(shared).percent(percent).build();
    }

    private Map<Long, Integer> ratingsByMovie(List<Review> reviews) {
        Map<Long, Integer> ratings = new HashMap<>();
        for (Review review : reviews) {
            if (review.getMovie() != null && review.getMovie().getId() != null && review.getRating() != null) {
                ratings.putIfAbsent(review.getMovie().getId(), review.getRating());
            }
        }
        return ratings;
    }

    private List<GenreShareDto> shares(Map<String, Integer> counts) {
        int total = counts.values().stream().mapToInt(Integer::intValue).sum();
        List<GenreShareDto> shares = new ArrayList<>();
        counts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder()))
                .limit(6)
                .forEach(entry -> shares.add(GenreShareDto.builder()
                        .name(entry.getKey())
                        .count(entry.getValue())
                        .percentage(total == 0 ? 0 : (int) Math.round(entry.getValue() * 100.0 / total))
                        .build()));
        return shares;
    }
}
