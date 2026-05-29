package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class ListEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private LocalDateTime creationDate;
    private LocalDateTime lastModificationDate;
    private int numberOfElements;
    private boolean isPrivateList;

    @OneToMany(mappedBy = "list")
    private Set<ListReaction> reactions;

    @OneToMany(mappedBy = "list")
    private Set<ListComment> comments;

}
