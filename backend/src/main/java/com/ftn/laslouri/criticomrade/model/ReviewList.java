package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import lombok.Data;

import java.util.Set;

@Entity
@Data
public class ReviewList extends ListEntity {

    @ManyToMany
    @JoinTable(
            name = "review_list_items",
            joinColumns = @JoinColumn(name = "list_id"),
            inverseJoinColumns = @JoinColumn(name = "review_id")
    )
    private Set<Review> reviews;

    // Other fields, getters, setters, etc.
}

