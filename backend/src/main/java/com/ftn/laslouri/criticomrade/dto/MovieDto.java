package com.ftn.laslouri.criticomrade.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MovieDto {

    private Long id;
    private Long tmdbId;
    private String title;
    private String description;
    private String genre;
    private String year;
    private String letterboxdLink;
    private String imdbLink;
    private String rottenTomatoesLink;
    private String youtubeTrailerLink;
    private String posterApiLink;
    private Double imdbRating;
    private Double rottenTomatoesRating;
}
