package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "recommendations")
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "from_user_id")
    private User fromUser;

    @ManyToOne(optional = false)
    @JoinColumn(name = "to_user_id")
    private User toUser;

    @ManyToOne(optional = false)
    @JoinColumn(name = "movie_id")
    private Movie movie;

    @Enumerated(EnumType.STRING)
    private RecommendationStatus status;

    private LocalDateTime creationTime;
    private int challengeDurationDays;
    private LocalDateTime endTime;
    private int challengePoints;
}
