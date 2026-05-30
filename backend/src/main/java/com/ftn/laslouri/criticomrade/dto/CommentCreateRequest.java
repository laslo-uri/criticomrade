package com.ftn.laslouri.criticomrade.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommentCreateRequest {

    @NotBlank
    private String text;
}
