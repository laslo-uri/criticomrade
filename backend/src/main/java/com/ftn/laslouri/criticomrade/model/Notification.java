package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "recipient_id")
    private User recipient;

    @ManyToOne
    @JoinColumn(name = "actor_id")
    private User actor;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    private String message;

    private boolean read;

    private LocalDateTime createdAt;

    private Long referenceId;
}
