package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data //@Getter, @Setter, and @RequiredArgsConstructor IN ONE!
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "movie_id")
    private Movie movie;

    private RecommendationStatus status; // Enum: ACCEPTED, REJECTED, PENDING, SOLVED

    private LocalDateTime creationTime;
    private int challengeDuration;
    private LocalDateTime endTime;

    private int challengePoints; // Points awarded for completing the challenge

}
