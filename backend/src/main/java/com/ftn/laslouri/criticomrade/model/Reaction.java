package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@MappedSuperclass
@Data
@EqualsAndHashCode(of = "id")
public abstract class Reaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "reaction_time")
    private LocalDateTime reactionTime;

    @Enumerated(EnumType.STRING)
    private ReactionType reactionType;
}
