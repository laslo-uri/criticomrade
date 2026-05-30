package com.ftn.laslouri.criticomrade.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ReviewDto {

    private Long id;
    private Integer rating;
    private String text;
    private MovieDto movie;
    private UserProfileDto author;
    private LocalDate dateWatched;
    private boolean seenBefore;
    private boolean spoiler;
    private LocalDateTime reviewTime;
    private LocalDateTime lastUpdated;
    private long commentCount;
    private List<ReactionSummaryDto> reactions;
}
