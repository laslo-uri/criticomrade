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

    @Transactional(readOnly = true)
    public PlatformStatsDto getStats() {
        return platformStatisticsRepository.findTopByOrderByIdDesc()
                .map(DtoMapper::toPlatformStatsDto)
                .orElseGet(this::recomputeAndReturn);
    }

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void scheduledRecompute() {
        recompute();
    }

    @Transactional
    public PlatformStatsDto recomputeAndReturn() {
        return DtoMapper.toPlatformStatsDto(recompute());
    }

    private PlatformStatistics recompute() {
        PlatformStatistics stats = new PlatformStatistics();
        stats.setUserCount((int) userRepository.count());
        stats.setMovieCount((int) movieRepository.count());
        stats.setReviewCount((int) reviewRepository.count());
        stats.setCommentCount((int) commentRepository.count());
        stats.setReactionCount((int) (movieReactionRepository.count()
                + reviewReactionRepository.count()
                + commentReactionRepository.count()));
        stats.setRecommendationCount((int) recommendationRepository.count());
        return platformStatisticsRepository.save(stats);
    }
}
