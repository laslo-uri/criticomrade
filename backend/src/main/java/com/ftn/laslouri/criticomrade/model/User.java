package com.ftn.laslouri.criticomrade.model;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    private String fullName;
    private String bio;
    private String avatarUrl;

    @Column(nullable = false)
    private String password;

    private boolean isProfilePublic = true;
    private int gainedChallengePoints;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_role",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "authority_id")
    )
    private List<Role> roles;

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

    @OneToMany(mappedBy = "fromUser")
    private Set<Recommendation> sentRecommendations;

    @OneToMany(mappedBy = "toUser")
    private Set<Recommendation> receivedRecommendations;

    @ManyToMany
    @JoinTable(
            name = "user_watchlist",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "movie_id")
    )
    private Set<Movie> watchlist = new HashSet<>();

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles == null ? List.of() : roles;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
