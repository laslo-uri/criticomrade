package com.ftn.laslouri.criticomrade.dto;

import com.ftn.laslouri.criticomrade.model.ListType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ListDto {

    private Long id;
    private String name;
    private ListType listType;
    private boolean privateList;
    private int numberOfElements;
    private LocalDateTime creationDate;
    private LocalDateTime lastModificationDate;
    private UserProfileDto owner;
    private List<MovieDto> movies;
    private List<ReviewDto> reviews;
    private List<CommentDto> comments;
}
