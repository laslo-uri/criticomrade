package com.ftn.laslouri.criticomrade.dto;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommentCreateRequest {

    @NotBlank
    @Size(max = 2000)
    private String text;
}
