package com.ftn.laslouri.criticomrade.dto;

import com.ftn.laslouri.criticomrade.model.RecommendationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RecommendationDto {

    private Long id;
    private UserProfileDto fromUser;
    private UserProfileDto toUser;
    private MovieDto movie;
    private RecommendationStatus status;
    private LocalDateTime creationTime;
    private int challengeDurationDays;
    private LocalDateTime endTime;
    private int challengePoints;
}
