package com.ftn.laslouri.criticomrade;

import org.flywaydb.core.api.FlywayException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import javax.sql.DataSource;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Skipped unless CRITICOMRADE_TEST_PG_URL names a throwaway Postgres server, for example
 * jdbc:postgresql://127.0.0.1:55433/postgres, trust auth, user postgres. Every scenario creates its own database there
 * and leaves it behind, so never point this at a server you care about.
 */
@SpringBootTest(properties = {
        "spring.datasource.driver-class-name=org.postgresql.Driver",
        "spring.datasource.username=postgres",
        "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect",
        "spring.jpa.hibernate.ddl-auto=update",
        "spring.flyway.enabled=true"
})
@ActiveProfiles("test")
@EnabledIfEnvironmentVariable(named = PostgresMigrationPathsTests.SERVER_URL, matches = ".+")
class PostgresMigrationPathsTests extends MigrationPathsContract {

    static final String SERVER_URL = "CRITICOMRADE_TEST_PG_URL";

    @DynamicPropertySource
    static void bootOnANewDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", PostgresMigrationPathsTests::createDatabase);
    }

    @Override
    DataSource newDatabase() {
        return dataSource(createDatabase());
    }

    /** On Postgres the failed V2 rolled back and left only V1 in the history, so the same database must now just work. */
    @Test
    void installThatFailedBeforeTheFixRecovers() {
        DataSource dataSource = newDatabase();
        assertThrows(FlywayException.class, () -> beforeTheFix(dataSource).migrate());
        assertEquals(List.of("1 SQL Success"), history(beforeTheFix(dataSource)));

        assertEquals(3, configured(dataSource).load().migrate().migrationsExecuted);
    }

    private static String createDatabase() {
        String serverUrl = System.getenv(SERVER_URL);
        String name = "migration_path_" + UUID.randomUUID().toString().replace("-", "");
        new JdbcTemplate(dataSource(serverUrl)).execute("CREATE DATABASE " + name);
        return serverUrl.replaceFirst("/[^/?]+(\\?.*)?$", "/" + name + "$1");
    }

    private static DataSource dataSource(String url) {
        return new DriverManagerDataSource(url, "postgres", "");
    }
}
