package com.ftn.laslouri.criticomrade.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GenreShareDto {
    private String name;
    private int count;
    private int percentage;
}
