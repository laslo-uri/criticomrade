package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class ListComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "list_id")
    private ListEntity list;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String text;

}
