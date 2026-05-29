package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Data //@Getter, @Setter, and @RequiredArgsConstructor IN ONE!
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int rating;
    private String text;

    @ManyToOne
    @JoinColumn(name = "movie_id")
    private Movie movie;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "review_time")
    private LocalDateTime reviewTime;

    @OneToMany(mappedBy = "review")
    private Set<ReviewReaction> reactions;

    // Add other relationships and methods as needed
}
