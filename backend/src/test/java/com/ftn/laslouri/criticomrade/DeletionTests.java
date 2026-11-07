package com.ftn.laslouri.criticomrade;

import com.ftn.laslouri.criticomrade.model.Movie;
import com.ftn.laslouri.criticomrade.repository.MovieRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Deletes of things other rows point at: reactions, comments, list items. They used to fail on foreign keys (500). */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:deletions;DB_CLOSE_DELAY=-1;MODE=PostgreSQL")
@ActiveProfiles("test")
class DeletionTests {

    private static final long TMDB_ID = 603L;

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private MovieRepository movies;
    @Autowired
    private JdbcTemplate jdbc;

    private MockMvc mvc;
    private String author;
    private String friend;
    private long movieId;

    @BeforeEach
    void twoUsersAndAMovie() throws Exception {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        movieId = movies.findByTmdbId(TMDB_ID).map(Movie::getId).orElseGet(() -> {
            Movie movie = new Movie();
            movie.setTmdbId(TMDB_ID);
            movie.setTitle("The Matrix");
            return movies.saveAndFlush(movie).getId();
        });
        author = register("author");
        friend = register("friend");
    }

    @Test
    void commentWithReactionsCanBeDeleted() throws Exception {
        int reviewId = review(author);
        int commentId = comment(friend, reviewId);
        react(author, "comment", commentId);
        react(friend, "comment", commentId);

        call(friend, delete("/api/comments/" + commentId)).andExpect(status().is2xxSuccessful());

        assertEquals(0, count("comment WHERE id = " + commentId));
        assertEquals(0, count("comment_reaction WHERE comment_id = " + commentId));
        call(author, get("/api/reviews/" + reviewId)).andExpect(status().isOk());
    }

    @Test
    void reviewWithCommentsReactionsAndListsCanBeDeleted() throws Exception {
        int reviewId = review(author);
        int commentId = comment(friend, reviewId);
        react(author, "comment", commentId);
        react(friend, "review", reviewId);
        int diaryId = list(author, "DIARY");
        call(author, post("/api/lists/" + diaryId + "/reviews/" + reviewId)).andExpect(status().is2xxSuccessful());
        call(author, get("/api/lists/" + diaryId)).andExpect(jsonPath("$.numberOfElements").value(1));

        call(author, delete("/api/reviews/" + reviewId)).andExpect(status().is2xxSuccessful());

        assertEquals(0, count("reviews WHERE id = " + reviewId));
        assertEquals(0, count("comment WHERE review_id = " + reviewId));
        assertEquals(0, count("comment_reaction WHERE comment_id = " + commentId));
        assertEquals(0, count("review_reaction WHERE review_id = " + reviewId));
        assertEquals(0, count("review_list_items WHERE review_id = " + reviewId));
        call(author, get("/api/lists/" + diaryId)).andExpect(status().isOk()).andExpect(jsonPath("$.numberOfElements").value(0));
    }

    @Test
    void listsWithItemsCanBeDeleted() throws Exception {
        int movieListId = list(author, "CUSTOM");
        call(author, post("/api/lists/" + movieListId + "/movies/" + TMDB_ID)).andExpect(status().isOk());
        int reviewId = review(author);
        int diaryId = list(author, "DIARY");
        call(author, post("/api/lists/" + diaryId + "/reviews/" + reviewId)).andExpect(status().is2xxSuccessful());

        call(author, delete("/api/lists/" + movieListId)).andExpect(status().is2xxSuccessful());
        call(author, delete("/api/lists/" + diaryId)).andExpect(status().is2xxSuccessful());

        assertEquals(0, count("list_entity WHERE id IN (" + movieListId + ", " + diaryId + ")"));
        assertEquals(0, count("movie_list_items WHERE list_id = " + movieListId));
        assertEquals(0, count("review_list_items WHERE list_id = " + diaryId));
        assertEquals(1, count("movies WHERE id = " + movieId));
        call(author, get("/api/reviews/" + reviewId)).andExpect(status().isOk());
    }

    @Test
    void movieCanLeaveAList() throws Exception {
        int listId = list(author, "CUSTOM");
        call(author, post("/api/lists/" + listId + "/movies/" + TMDB_ID)).andExpect(status().isOk());

        call(author, delete("/api/lists/" + listId + "/movies/" + movieId)).andExpect(status().is2xxSuccessful());

        assertEquals(0, count("movie_list_items WHERE list_id = " + listId));
    }

    private String register(String prefix) throws Exception {
        String username = prefix + "_" + System.nanoTime();
        String body = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"email\":\"" + username + "@example.test\",\"password\":\"secret-1\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + JsonPath.read(body, "$.token");
    }

    private int review(String bearer) throws Exception {
        return idOf(call(bearer, post("/api/reviews"), "{\"tmdbId\":" + TMDB_ID + ",\"rating\":8,\"text\":\"Good\"}"));
    }

    private int comment(String bearer, int reviewId) throws Exception {
        return idOf(call(bearer, post("/api/reviews/" + reviewId + "/comments"), "{\"text\":\"Agreed\"}"));
    }

    private void react(String bearer, String targetType, int targetId) throws Exception {
        call(bearer, post("/api/reactions/" + targetType + "/" + targetId), "{\"reactionType\":\"LIKE\"}")
                .andExpect(status().isOk());
    }

    private int list(String bearer, String listType) throws Exception {
        return idOf(call(bearer, post("/api/lists"), "{\"name\":\"A list\",\"listType\":\"" + listType + "\"}"));
    }

    private int idOf(ResultActions result) throws Exception {
        return JsonPath.read(result.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
    }

    private ResultActions call(String bearer, org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request)
            throws Exception {
        return mvc.perform(request.header("Authorization", bearer));
    }

    private ResultActions call(String bearer, org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request,
                               String json) throws Exception {
        return mvc.perform(request.header("Authorization", bearer).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private int count(String fromWhere) {
        return jdbc.queryForObject("SELECT count(*) FROM " + fromWhere, Integer.class);
    }
}
