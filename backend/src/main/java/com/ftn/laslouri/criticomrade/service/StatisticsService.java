package com.ftn.laslouri.criticomrade.service;

import com.ftn.laslouri.criticomrade.dto.PlatformStatsDto;
import com.ftn.laslouri.criticomrade.mapper.DtoMapper;
import com.ftn.laslouri.criticomrade.model.PlatformStatistics;
import com.ftn.laslouri.criticomrade.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final PlatformStatisticsRepository platformStatisticsRepository;
    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final ReviewRepository reviewRepository;
    private final CommentRepository commentRepository;
    private final MovieReactionRepository movieReactionRepository;
    private final ReviewReactionRepository reviewReactionRepository;
    private final CommentReactionRepository commentReactionRepository;
    private final RecommendationRepository recommendationRepository;

    /**
     * Before the first scheduled recompute has stored a row (a new database), count live instead of saving one.
     * Saving here used to fail: this transaction is read-only (500 on a fresh install).
     */
    @Transactional(readOnly = true)
    public PlatformStatsDto getStats() {
        return DtoMapper.toPlatformStatsDto(platformStatisticsRepository.findTopByOrderByIdDesc().orElseGet(this::count));
    }

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void scheduledRecompute() {
        platformStatisticsRepository.save(count());
    }

    private PlatformStatistics count() {
        PlatformStatistics stats = new PlatformStatistics();
        stats.setUserCount((int) userRepository.count());
        stats.setMovieCount((int) movieRepository.count());
        stats.setReviewCount((int) reviewRepository.count());
        stats.setCommentCount((int) commentRepository.count());
        stats.setReactionCount((int) (movieReactionRepository.count()
                + reviewReactionRepository.count()
                + commentReactionRepository.count()));
        stats.setRecommendationCount((int) recommendationRepository.count());
        return stats;
    }
}
