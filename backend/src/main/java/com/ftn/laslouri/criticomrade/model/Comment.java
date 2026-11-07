package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Data //@Getter, @Setter, and @RequiredArgsConstructor IN ONE!
@EqualsAndHashCode(of = "id")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String text;

    @ManyToOne
    @JoinColumn(name = "review_id")
    private Review review;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "comment_time")
    private LocalDateTime commentTime;

    /** Deleting a comment takes its reactions with it; they point at it with a foreign key. */
    @OneToMany(mappedBy = "comment", cascade = CascadeType.REMOVE)
    private Set<CommentReaction> reactions;

}
