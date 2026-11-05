package com.ftn.laslouri.criticomrade.dto;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UserUpdateRequest {

    @Size(max = 80)
    private String fullName;
    @Size(max = 280)
    private String bio;
    @Size(max = 512)
    @Pattern(regexp = "(https?://\\S+)?", message = "Avatar must be an http or https address")
    private String avatarUrl;
    private Boolean profilePublic;
}
