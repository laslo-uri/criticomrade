package com.ftn.laslouri.criticomrade;

import com.ftn.laslouri.criticomrade.model.Movie;
import com.ftn.laslouri.criticomrade.model.Review;
import com.ftn.laslouri.criticomrade.model.ReviewReaction;
import com.ftn.laslouri.criticomrade.repository.MovieRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * These answered 500 once a movie had a review: hashing a Review or Movie walked its lazy collections, which load while
 * being iterated (ConcurrentModificationException). Hashing an entity must stop at its id.
 */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:reviewed-movie;DB_CLOSE_DELAY=-1;MODE=PostgreSQL")
@ActiveProfiles("test")
class ReviewedMovieEndpointsTests {

    private static final long TMDB_ID = 603L;

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private MovieRepository movies;

    private MockMvc mvc;
    private String username;
    private String bearer;
    private int reviewId;

    @BeforeEach
    void aMovieWithAReviewAndAReaction() throws Exception {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        if (movies.findByTmdbId(TMDB_ID).isEmpty()) {
            Movie movie = new Movie();
            movie.setTmdbId(TMDB_ID);
            movie.setTitle("The Matrix");
            movies.saveAndFlush(movie);
        }
        username = "reviewer_" + System.nanoTime();
        String registered = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"email\":\"" + username + "@example.test\",\"password\":\"secret-1\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        bearer = "Bearer " + JsonPath.read(registered, "$.token");
        String review = mvc.perform(post("/api/reviews").header("Authorization", bearer).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tmdbId\":" + TMDB_ID + ",\"rating\":8,\"text\":\"Good\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        reviewId = JsonPath.read(review, "$.id");
        mvc.perform(post("/api/reactions/review/" + reviewId).header("Authorization", bearer).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reactionType\":\"LIKE\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void feedAnswers() throws Exception {
        mvc.perform(get("/api/feed").header("Authorization", bearer)).andExpect(status().isOk());
    }

    @Test
    void reviewsOfAUserAnswer() throws Exception {
        mvc.perform(get("/api/users/" + username + "/reviews").header("Authorization", bearer)).andExpect(status().isOk());
    }

    @Test
    void aReviewedMovieCanJoinAList() throws Exception {
        String list = mvc.perform(post("/api/lists").header("Authorization", bearer).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Favourites\",\"listType\":\"CUSTOM\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int listId = JsonPath.read(list, "$.id");

        mvc.perform(post("/api/lists/" + listId + "/movies/" + TMDB_ID).header("Authorization", bearer))
                .andExpect(status().isOk());
    }

    @Test
    void commentsWithAReactionAnswer() throws Exception {
        String comment = mvc.perform(post("/api/reviews/" + reviewId + "/comments").header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"text\":\"Agreed\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int commentId = JsonPath.read(comment, "$.id");
        mvc.perform(post("/api/reactions/comment/" + commentId).header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reactionType\":\"LIKE\"}"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/reviews/" + reviewId + "/comments").header("Authorization", bearer)).andExpect(status().isOk());
    }

    @Test
    void entityHashingStopsAtTheId() {
        Movie movie = new Movie();
        movie.setId(1L);
        Review review = new Review();
        review.setId(2L);
        int movieHash = movie.hashCode();
        int reviewHash = review.hashCode();

        review.setMovie(movie);
        movie.setReviews(Set.of(review));
        ReviewReaction reaction = new ReviewReaction();
        reaction.setReview(review);
        review.setReactions(Set.of(reaction));

        assertEquals(movieHash, movie.hashCode());
        assertEquals(reviewHash, review.hashCode());
    }
}
