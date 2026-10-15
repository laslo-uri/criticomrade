package com.ftn.laslouri.criticomrade.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DiaryStatsDto {
    private int year;
    private int yearCount;
    private double yearAverage;
    private String topGenre;
    private List<Integer> distribution;
    private List<GenreShareDto> mediaTypes;
}
