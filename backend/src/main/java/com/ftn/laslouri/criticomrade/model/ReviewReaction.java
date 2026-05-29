package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class ReviewReaction extends Reaction {

    @ManyToOne
    @JoinColumn(name = "review_id")
    private Review review;

}
