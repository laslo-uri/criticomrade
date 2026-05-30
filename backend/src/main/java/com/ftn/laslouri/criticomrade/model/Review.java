package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Data
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer rating;
    private String text;

    @ManyToOne(optional = false)
    @JoinColumn(name = "movie_id")
    private Movie movie;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    private LocalDate dateWatched;
    private boolean seenBefore;
    private boolean isContainedSpoiler;

    @Column(name = "review_time")
    private LocalDateTime reviewTime;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Comment> comments;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ReviewReaction> reactions;
}
