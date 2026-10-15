package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Set;

@Entity
@Data
@Table(name = "movies")
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private Long tmdbId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MediaType mediaType = MediaType.FILM;

    @Column(length = 160)
    private String externalKey;

    private String creator;
    private String backdropApiLink;
    private String network;
    private Integer seasonCount;
    private Integer seasonNumber;
    private Integer episodeNumber;
    private Integer pageCount;
    private Integer trackCount;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Movie parent;

    private String title;
    private String description;
    private String genre;

    @Column(name = "release_year")
    private String year;
    private String letterboxdLink;
    private String imdbLink;
    private String rottenTomatoesLink;
    private String youtubeTrailerLink;
    private String posterApiLink;
    private Double imdbRating;
    private Double rottenTomatoesRating;

    @OneToMany(mappedBy = "movie")
    private Set<Review> reviews;

    @ManyToMany(mappedBy = "watchlist")
    private Set<User> usersWatched;

    @OneToMany(mappedBy = "movie")
    private Set<MovieReaction> reactions;
}
