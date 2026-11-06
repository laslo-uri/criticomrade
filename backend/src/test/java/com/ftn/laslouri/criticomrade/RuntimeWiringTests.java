package com.ftn.laslouri.criticomrade;

import com.ftn.laslouri.criticomrade.model.User;
import com.ftn.laslouri.criticomrade.repository.UserRepository;
import com.ftn.laslouri.criticomrade.security.JwtService;
import com.jayway.jsonpath.JsonPath;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Things the plain context test cannot see, because its profile turns Flyway and the API docs off.
 * Flyway stops at the empty V1 here: V2 needs Postgres-only SQL (see {@link H2MigrationPathsTests}).
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:runtime-wiring;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.flyway.enabled=true",
        "spring.flyway.target=1",
        "springdoc.api-docs.enabled=true"
})
@ActiveProfiles("test")
class RuntimeWiringTests {

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private Flyway flyway;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtService jwtService;

    @Test
    void flywayRunsAtStartup() {
        assertEquals("1", flyway.info().current().getVersion().getVersion());
    }

    @Test
    void flywayCanTalkToPostgres() {
        assertDoesNotThrow(() -> Class.forName("org.flywaydb.database.postgresql.PostgreSQLDatabaseType"));
    }

    @Test
    void apiDocsRender() throws Exception {
        mvc().perform(get("/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi").exists());
    }

    @Test
    void unknownPathIsNotFoundAndKeepsTheErrorShape() throws Exception {
        User user = new User();
        user.setUsername("wiring");
        user.setEmail("wiring@example.test");
        user.setPassword("not-a-real-hash");
        user.setRoles(new ArrayList<>());
        user = userRepository.save(user);

        mvc().perform(get("/api/no-such-path").header("Authorization", "Bearer " + jwtService.generateToken(user)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.timestamp").isString());
    }

    @Test
    void anonymousRequestGetsJson401() throws Exception {
        mvc().perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    void registerThenLoginOverJson() throws Exception {
        String credentials = "\"username\":\"loginflow\",\"password\":\"correct-horse\"";
        mvc().perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{" + credentials + ",\"email\":\"loginflow@example.test\"}"))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.token").isString());

        String token = JsonPath.read(mvc().perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{" + credentials + "}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(), "$.token");

        mvc().perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username").value("loginflow"));

        mvc().perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"loginflow\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized());
    }

    private MockMvc mvc() {
        return MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }
}
