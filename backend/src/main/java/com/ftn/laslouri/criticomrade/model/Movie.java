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
