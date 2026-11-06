package com.ftn.laslouri.criticomrade;

import org.flywaydb.core.Flyway;
import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Runs on H2 in PostgreSQL mode, so it checks the migration's logic, not real Postgres. */
class TokenVersionMigrationTests {

    @Test
    void existingUsersStartAtVersionZero() {
        JdbcDataSource dataSource = new JdbcDataSource();
        dataSource.setURL("jdbc:h2:mem:token-version;DB_CLOSE_DELAY=-1;MODE=PostgreSQL");
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        jdbc.execute("CREATE TABLE users (id BIGINT PRIMARY KEY)");
        jdbc.execute("INSERT INTO users (id) VALUES (1)");

        Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("3")
                .load()
                .migrate();

        assertEquals(0, jdbc.queryForObject("SELECT token_version FROM users WHERE id = 1", Integer.class));
    }
}
