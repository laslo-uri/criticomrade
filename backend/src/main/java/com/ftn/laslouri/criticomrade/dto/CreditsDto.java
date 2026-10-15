package com.ftn.laslouri.criticomrade.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CreditsDto {
    private List<String> cast;
    private List<String> tracks;
}
