package com.ftn.laslouri.criticomrade.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CompatibilityDto {
    private int sharedCount;
    private Integer percent;
}
