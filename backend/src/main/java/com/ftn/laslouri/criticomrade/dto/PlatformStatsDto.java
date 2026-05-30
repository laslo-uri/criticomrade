package com.ftn.laslouri.criticomrade.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlatformStatsDto {

    private int userCount;
    private int movieCount;
    private int reviewCount;
    private int commentCount;
    private int reactionCount;
    private int recommendationCount;
}
