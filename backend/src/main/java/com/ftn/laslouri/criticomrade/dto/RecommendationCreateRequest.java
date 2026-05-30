package com.ftn.laslouri.criticomrade.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RecommendationCreateRequest {

    @NotNull
    private String toUsername;

    @NotNull
    private Long tmdbId;

    @Min(1)
    private int challengeDurationDays = 7;

    @Min(0)
    private int challengePoints = 10;
}
