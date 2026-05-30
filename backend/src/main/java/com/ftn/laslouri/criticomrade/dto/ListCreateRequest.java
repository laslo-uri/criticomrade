package com.ftn.laslouri.criticomrade.dto;

import com.ftn.laslouri.criticomrade.model.ListType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ListCreateRequest {

    @NotBlank
    private String name;

    @NotNull
    private ListType listType;

    private boolean privateList;
}
