package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class CommentReaction extends Reaction {

    @ManyToOne
    @JoinColumn(name = "comment_id")
    private Comment comment;

}
