package com.ftn.laslouri.criticomrade.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MovieDto {

    private Long id;
    private Long tmdbId;
    private String mediaType;
    private String externalKey;
    private String creator;
    private String backdropApiLink;
    private String network;
    private Integer seasonCount;
    private Integer seasonNumber;
    private Integer episodeNumber;
    private Integer pageCount;
    private Integer trackCount;
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
