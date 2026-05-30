package com.ftn.laslouri.criticomrade.dto;

import com.ftn.laslouri.criticomrade.model.ReactionType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReactionToggleRequest {

    @NotNull
    private ReactionType reactionType;

    private String targetType;

    private Long targetId;
}
