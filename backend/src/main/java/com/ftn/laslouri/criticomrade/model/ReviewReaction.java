package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class ReviewReaction extends Reaction {

    @ManyToOne
    @JoinColumn(name = "review_id")
    private Review review;

}
