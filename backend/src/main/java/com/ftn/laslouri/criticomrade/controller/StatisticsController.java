package com.ftn.laslouri.criticomrade.controller;

import com.ftn.laslouri.criticomrade.dto.PlatformStatsDto;
import com.ftn.laslouri.criticomrade.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping
    public PlatformStatsDto getStats() {
        return statisticsService.getStats();
    }
}
