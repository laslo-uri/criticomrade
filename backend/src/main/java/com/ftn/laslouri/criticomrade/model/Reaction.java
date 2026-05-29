package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@MappedSuperclass
public abstract class Reaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "reaction_time")
    private LocalDateTime reactionTime;

    @Enumerated(EnumType.STRING)
    private ReactionType reactionType;

    // Constructors, getters, setters
}
