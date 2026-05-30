package com.ftn.laslouri.criticomrade.repository;

import com.ftn.laslouri.criticomrade.model.PlatformStatistics;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlatformStatisticsRepository extends JpaRepository<PlatformStatistics, Long> {

    Optional<PlatformStatistics> findTopByOrderByIdDesc();
}
