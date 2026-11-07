package com.ftn.laslouri.criticomrade;

import com.ftn.laslouri.criticomrade.model.Movie;
import com.ftn.laslouri.criticomrade.repository.MovieRepository;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;

import javax.sql.DataSource;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The two ways a database meets the migrations: a brand-new install, where the whole app boots on an empty database,
 * and an existing database whose Flyway history was written before beforeMigrate.sql existed.
 * The subclasses run this on H2 and, when one is offered, on real Postgres.
 */
abstract class MigrationPathsContract {

    /** What Flyway stored for these files. Editing an applied migration changes these and breaks every existing database. */
    private static final Map<String, Integer> APPLIED_CHECKSUMS = Map.of(
            "1", -1445823737,
            "2", -207363152,
            "3", 16148822,
            "4", 331552760);

    @Autowired
    Flyway flyway;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    MovieRepository movies;

    @Autowired
    WebApplicationContext context;

    /** A new, empty database on the same engine as the booted app, for the scenarios that build their own history. */
    abstract DataSource newDatabase();

    @Test
    void freshInstallAppliesEveryMigrationAndBoots() {
        assertEquals(List.of("1 SQL Success", "2 SQL Success", "3 SQL Success", "4 SQL Success"), history(flyway));
        assertEquals(0, flyway.info().pending().length);

        List<String> columns = columns(jdbc);
        assertTrue(columns.contains("movies.external_key"), "added by V2");
        assertTrue(columns.contains("movies.title"), "added by Hibernate");
        assertTrue(columns.contains("users.token_version"), "V4 skips a missing table, Hibernate must add it");
        assertTrue(columns.contains("password_reset_tokens.failed_attempts"), "V3 skips a missing table, Hibernate must add it");
    }

    @Test
    void freshInstallCanStoreMoviesAndEnforcesTheExternalKeyIndex() {
        Movie first = movies.saveAndFlush(movie("fresh-install-key"));
        assertNotNull(first.getId());
        movies.saveAndFlush(movie(null));
        movies.saveAndFlush(movie(null));

        assertThrows(DataIntegrityViolationException.class, () -> movies.saveAndFlush(movie("fresh-install-key")));
    }

    /** The frontend probes /api/stats to tell a real API from none; it must answer JSON before any stats row exists. */
    @Test
    void statsAnswerBeforeTheFirstRecompute() throws Exception {
        jdbc.update("DELETE FROM platform_statistics");
        MockMvc mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        mvc.perform(get("/api/stats"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.userCount").isNumber())
                .andExpect(jsonPath("$.movieCount").isNumber())
                .andExpect(jsonPath("$.reviewCount").isNumber())
                .andExpect(jsonPath("$.commentCount").isNumber())
                .andExpect(jsonPath("$.reactionCount").isNumber())
                .andExpect(jsonPath("$.recommendationCount").isNumber())
                .andExpect(jsonPath("$.demo").doesNotExist());
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM platform_statistics", Integer.class));
    }

    @Test
    void freshInstallSurvivesARestart() {
        assertDoesNotThrow(flyway::validate);
        assertEquals(0, flyway.migrate().migrationsExecuted);
    }

    @Test
    void migrationFilesStillHaveTheirAppliedChecksums() {
        Map<String, Integer> resolved = new TreeMap<>();
        for (MigrationInfo info : configured(newDatabase()).load().info().pending()) {
            resolved.put(info.getVersion().getVersion(), info.getChecksum());
        }
        assertEquals(new TreeMap<>(APPLIED_CHECKSUMS), resolved);
    }

    @Test
    void databaseBaselinedAndAlreadyAtV4IsLeftAlone() {
        DataSource dataSource = newDatabase();
        createTablesLikeHibernateDid(new JdbcTemplate(dataSource));
        beforeTheFix(dataSource).migrate();

        assertUntouchedByTheFix(dataSource, List.of(
                "1 BASELINE Baseline", "2 SQL Success", "3 SQL Success", "4 SQL Success"));
    }

    @Test
    void databaseThatRanV1AndAlreadyAtV4IsLeftAlone() {
        DataSource dataSource = newDatabase();
        configured(dataSource).skipDefaultCallbacks(true).target("1").load().migrate();
        createTablesLikeHibernateDid(new JdbcTemplate(dataSource));
        beforeTheFix(dataSource).migrate();

        assertUntouchedByTheFix(dataSource, List.of(
                "1 SQL Success", "2 SQL Success", "3 SQL Success", "4 SQL Success"));
    }

    @Test
    void databaseAtV2StillCatchesUp() {
        DataSource dataSource = newDatabase();
        JdbcTemplate existing = new JdbcTemplate(dataSource);
        createTablesLikeHibernateDid(existing);
        configured(dataSource).skipDefaultCallbacks(true).target("2").load().migrate();

        assertEquals(2, configured(dataSource).load().migrate().migrationsExecuted);

        assertTrue(columns(existing).contains("users.token_version"));
        assertEquals("Stalker", existing.queryForObject("SELECT title FROM movies", String.class));
    }

    @Test
    void freshInstallKeepsTheBackdropColumnV2Created() {
        assertEquals(512, backdropLength(jdbc));

        Movie stored = movie(null);
        stored.setBackdropApiLink("x".repeat(512));
        assertEquals(512, movies.saveAndFlush(stored).getBackdropApiLink().length());
    }

    @Test
    void hibernateLeavesAnExistingBackdropColumnAtV2sLength() {
        JdbcTemplate existing = databaseAtV4WithBackdrop("https://image.example/short.jpg");

        hibernateUpdate(existing);

        assertEquals(512, backdropLength(existing));
        assertEquals("https://image.example/short.jpg", backdrop(existing));
    }

    @Test
    void hibernateKeepsAValueLongerThan255OnAnExistingDatabase() {
        String longValue = "x".repeat(400);
        JdbcTemplate existing = databaseAtV4WithBackdrop(longValue);

        hibernateUpdate(existing);

        assertEquals(512, backdropLength(existing));
        assertEquals(longValue, backdrop(existing));
    }

    /** A database the old mapping already shrank goes back to V2's length at its next start, values intact. */
    @Test
    void hibernateWidensABackdropColumnTheOldMappingShrank() {
        JdbcTemplate existing = databaseAtV4WithBackdrop("https://image.example/short.jpg");
        existing.execute("ALTER TABLE movies ALTER COLUMN backdrop_api_link SET DATA TYPE VARCHAR(255)");
        assertEquals(255, backdropLength(existing));

        hibernateUpdate(existing);

        assertEquals(512, backdropLength(existing));
        assertEquals("https://image.example/short.jpg", backdrop(existing));
    }

    private JdbcTemplate databaseAtV4WithBackdrop(String value) {
        DataSource dataSource = newDatabase();
        JdbcTemplate existing = new JdbcTemplate(dataSource);
        createTablesLikeHibernateDid(existing);
        beforeTheFix(dataSource).migrate();
        assertEquals(512, backdropLength(existing));
        existing.update("UPDATE movies SET backdrop_api_link = ?", value);
        return existing;
    }

    /** The entities against this database with ddl-auto=update, the step the app runs right after Flyway at every start. */
    private static void hibernateUpdate(JdbcTemplate database) {
        LocalContainerEntityManagerFactoryBean factory = new LocalContainerEntityManagerFactoryBean();
        factory.setDataSource(database.getDataSource());
        factory.setPackagesToScan(Movie.class.getPackageName());
        factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        factory.setJpaPropertyMap(Map.of(
                "hibernate.hbm2ddl.auto", "update",
                "hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy"));
        factory.afterPropertiesSet();
        factory.destroy();
    }

    private static int backdropLength(JdbcTemplate jdbc) {
        return jdbc.queryForObject(
                "SELECT character_maximum_length FROM information_schema.columns WHERE table_schema = CURRENT_SCHEMA "
                        + "AND lower(table_name) = 'movies' AND lower(column_name) = 'backdrop_api_link'",
                Integer.class);
    }

    private static String backdrop(JdbcTemplate jdbc) {
        return jdbc.queryForObject("SELECT backdrop_api_link FROM movies", String.class);
    }

    private void assertUntouchedByTheFix(DataSource dataSource, List<String> expectedHistory) {
        JdbcTemplate existing = new JdbcTemplate(dataSource);
        Flyway before = beforeTheFix(dataSource);
        assertEquals(expectedHistory, history(before));
        List<String> historyBefore = fullHistory(before);
        List<String> columnsBefore = columns(existing);

        Flyway now = configured(dataSource).load();
        assertDoesNotThrow(now::validate);
        assertEquals(0, now.migrate().migrationsExecuted);

        assertEquals(historyBefore, fullHistory(now));
        assertEquals(columnsBefore, columns(existing));
        assertEquals("Stalker", existing.queryForObject("SELECT title FROM movies", String.class));
    }

    /** The settings application.properties gives Flyway. */
    static FluentConfiguration configured(DataSource dataSource) {
        return Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true);
    }

    /** Same migrations, without beforeMigrate.sql: what an existing database was migrated with. */
    static Flyway beforeTheFix(DataSource dataSource) {
        return configured(dataSource).skipDefaultCallbacks(true).load();
    }

    private static void createTablesLikeHibernateDid(JdbcTemplate jdbc) {
        jdbc.execute("CREATE TABLE movies (id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, title VARCHAR(255))");
        jdbc.execute("CREATE TABLE users (id BIGINT PRIMARY KEY)");
        jdbc.execute("CREATE TABLE password_reset_tokens (id BIGINT PRIMARY KEY)");
        jdbc.update("INSERT INTO movies (title) VALUES ('Stalker')");
    }

    private static Movie movie(String externalKey) {
        Movie movie = new Movie();
        movie.setTitle("Stalker");
        movie.setExternalKey(externalKey);
        return movie;
    }

    static List<String> history(Flyway flyway) {
        return Arrays.stream(flyway.info().applied())
                .map(info -> info.getVersion() + " " + info.getType().name() + " " + info.getState().getDisplayName())
                .toList();
    }

    private static List<String> fullHistory(Flyway flyway) {
        return Arrays.stream(flyway.info().applied())
                .map(info -> info.getInstalledRank() + " " + info.getVersion() + " " + info.getType().name() + " "
                        + info.getChecksum() + " " + info.getInstalledOn() + " " + info.getState())
                .toList();
    }

    private static List<String> columns(JdbcTemplate jdbc) {
        return jdbc.queryForList(
                "SELECT lower(table_name) || '.' || lower(column_name) FROM information_schema.columns "
                        + "WHERE table_schema = CURRENT_SCHEMA ORDER BY 1",
                String.class);
    }
}
