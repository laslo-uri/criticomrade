package com.ftn.laslouri.criticomrade.dto;

import com.ftn.laslouri.criticomrade.model.ReactionType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReactionSummaryDto {

    private ReactionType type;
    private long count;
    private boolean reactedByCurrentUser;
}
