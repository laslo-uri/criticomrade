package com.ftn.laslouri.criticomrade.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CommentDto {

    private Long id;
    private String text;
    private UserProfileDto author;
    private Long reviewId;
    private LocalDateTime commentTime;
    private List<ReactionSummaryDto> reactions;
}
