package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Data //@Getter, @Setter, and @RequiredArgsConstructor IN ONE!
@Inheritance(strategy = InheritanceType.JOINED)
@Table(name = "Users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String email;
    private String password;
    private boolean isProfilePublic;

    // For Authority - Which roles have authority for some actions?
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "USER_ROLE",
            joinColumns = @JoinColumn(name = "user_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "authority_id", referencedColumnName = "authority_id"))
    private List<Role> authorities;

    @ManyToMany
    @JoinTable(
            name = "followers",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "follower_id")
    )
    private Set<User> followers = new HashSet<>();

    @ManyToMany(mappedBy = "followers")
    private Set<User> following = new HashSet<>();

    @OneToMany(mappedBy = "user")
    private Set<Review> reviews;

    @OneToMany(mappedBy = "user")
    private Set<Comment> comments;

    @OneToMany(mappedBy = "user")
    private Set<MovieReaction> givenMovieReactions;

    @OneToMany(mappedBy = "user")
    private Set<ReviewReaction> givenReviewReactions;

    @OneToMany(mappedBy = "user")
    private Set<CommentReaction> givenCommentReactions;

    @OneToMany(mappedBy = "sender")
    private Set<FollowRequest> sentFollowRequests;

    @OneToMany(mappedBy = "receiver")
    private Set<FollowRequest> receivedFollowRequests;

    @OneToMany(mappedBy = "user")
    private Set<Recommendation> recommendations;

    @ManyToMany
    @JoinTable(
            name = "user_watchlist",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "movie_id")
    )
    private Set<Movie> watchlist;



    private int gainedChallengePoints; // Total challenge points earned by the user




    // ------------------------ UserDetails ------------------------

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return null;
    }

    @Override
    public boolean isAccountNonExpired() {
        return false;
    }

    @Override
    public boolean isAccountNonLocked() {
        return false;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return false;
    }

    @Override
    public boolean isEnabled() {
        return false;
    }
}

