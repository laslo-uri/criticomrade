package com.ftn.laslouri.criticomrade.dto;

import lombok.Data;

@Data
public class UserUpdateRequest {

    private String fullName;
    private String bio;
    private String avatarUrl;
    private Boolean profilePublic;
}
