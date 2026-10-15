package com.ftn.laslouri.criticomrade.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TasteProfileDto {
    private int ratedCount;
    private double averageRating;
    private List<GenreShareDto> genres;
    private List<GenreShareDto> mediaTypes;
}
