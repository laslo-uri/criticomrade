package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class CommentReaction extends Reaction {

    @ManyToOne
    @JoinColumn(name = "comment_id")
    private Comment comment;

    // Define getters and setters
}
