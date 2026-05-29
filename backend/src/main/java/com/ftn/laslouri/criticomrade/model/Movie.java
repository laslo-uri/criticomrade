package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Set;

@Entity
@Data //@Getter, @Setter, and @RequiredArgsConstructor IN ONE!
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private String genre;
    private String letterboxdLink;
    private String imdbLink;
    private String rottenTomatoesLink;
    private String youtubeTrailerLink;
    private String posterApiLink;

    // Add other fields as needed

    @OneToMany(mappedBy = "movie")
    private Set<Review> reviews;

    @ManyToMany(mappedBy = "watchlist")
    private Set<User> usersWatched;

    @OneToMany(mappedBy = "movie")
    private Set<MovieReaction> reactions;

    // Add other relationships and methods as needed
}

