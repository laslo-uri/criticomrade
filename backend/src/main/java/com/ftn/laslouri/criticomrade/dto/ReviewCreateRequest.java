package com.ftn.laslouri.criticomrade.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ReviewCreateRequest {

    @NotNull
    private Long tmdbId;

    @Min(1)
    @Max(10)
    private Integer rating;

    private String text;
    private LocalDate dateWatched;
    private boolean seenBefore;
    private boolean spoiler;
}
