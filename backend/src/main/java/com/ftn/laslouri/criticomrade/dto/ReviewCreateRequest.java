package com.ftn.laslouri.criticomrade.dto;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ReviewCreateRequest {

    private Long tmdbId;
    @Size(max = 160)
    private String externalKey;
    private String mediaType;

    @Min(1)
    @Max(10)
    private Integer rating;

    @Size(max = 4000)
    private String text;
    private LocalDate dateWatched;
    private boolean seenBefore;
    private boolean spoiler;
}
