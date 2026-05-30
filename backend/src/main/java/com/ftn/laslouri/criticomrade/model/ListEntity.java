package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Data
@EqualsAndHashCode(of = "id")
public abstract class ListEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private LocalDateTime creationDate;
    private LocalDateTime lastModificationDate;
    private int numberOfElements;
    private boolean isPrivateList;

    @Enumerated(EnumType.STRING)
    private ListType listType;

    @ManyToOne(optional = false)
    @JoinColumn(name = "owner_id")
    private User owner;

    @OneToMany(mappedBy = "list", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ListReaction> reactions = new HashSet<>();

    @OneToMany(mappedBy = "list", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ListComment> comments = new HashSet<>();
}
