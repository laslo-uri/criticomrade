package com.ftn.laslouri.criticomrade.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FollowRequestDto {

    private Long id;
    private UserProfileDto sender;
    private UserProfileDto receiver;
    private LocalDateTime requestDateTime;
}
