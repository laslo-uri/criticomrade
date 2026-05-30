package com.ftn.laslouri.criticomrade.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserProfileDto {

    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String bio;
    private String avatarUrl;
    private boolean profilePublic;
    private int gainedChallengePoints;
    private long followerCount;
    private long followingCount;
    private boolean following;
}
