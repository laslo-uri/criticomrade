package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class MovieReaction extends Reaction {

    @ManyToOne
    @JoinColumn(name = "movie_id")
    private Movie movie;

}
