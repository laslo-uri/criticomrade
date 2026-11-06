package com.ftn.laslouri.criticomrade;

import org.h2.jdbcx.JdbcDataSource;
import org.springframework.boot.flyway.autoconfigure.FlywayConfigurationCustomizer;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.datasource.DelegatingDataSource;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * H2 in PostgreSQL mode. It has no partial indexes, so the one WHERE clause in V2 is dropped as the statement is sent:
 * the file and its checksum stay the real ones, and H2's plain unique index also lets many NULLs through.
 * This checks Flyway's and Hibernate's behaviour, not Postgres. See {@link PostgresMigrationPathsTests} for that.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:fresh-install;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.jpa.hibernate.ddl-auto=update",
        "spring.flyway.enabled=true"
})
@ActiveProfiles("test")
class H2MigrationPathsTests extends MigrationPathsContract {

    private static final AtomicInteger DATABASES = new AtomicInteger();

    @TestConfiguration
    static class FlywayOnH2 {
        @Bean
        FlywayConfigurationCustomizer tolerateThePartialIndex(DataSource dataSource) {
            return configuration -> configuration.dataSource(withoutPartialIndex(dataSource));
        }
    }

    @Override
    DataSource newDatabase() {
        JdbcDataSource dataSource = new JdbcDataSource();
        dataSource.setURL("jdbc:h2:mem:migration-path-" + DATABASES.incrementAndGet() + ";DB_CLOSE_DELAY=-1;MODE=PostgreSQL");
        return withoutPartialIndex(dataSource);
    }

    private static DataSource withoutPartialIndex(DataSource dataSource) {
        return new DelegatingDataSource(dataSource) {
            @Override
            public Connection getConnection() throws SQLException {
                Connection connection = super.getConnection();
                return (Connection) Proxy.newProxyInstance(getClass().getClassLoader(), new Class<?>[]{Connection.class},
                        (proxy, method, args) -> {
                            Object result = invoke(connection, method, args);
                            return result instanceof Statement && method.getReturnType() == Statement.class
                                    ? withoutPartialIndex((Statement) result)
                                    : result;
                        });
            }
        };
    }

    private static Statement withoutPartialIndex(Statement statement) {
        return (Statement) Proxy.newProxyInstance(H2MigrationPathsTests.class.getClassLoader(), new Class<?>[]{Statement.class},
                (proxy, method, args) -> {
                    if (args != null && args.length > 0 && args[0] instanceof String sql) {
                        args[0] = sql.replace(" WHERE external_key IS NOT NULL", "");
                    }
                    return invoke(statement, method, args);
                });
    }

    private static Object invoke(Object target, java.lang.reflect.Method method, Object[] args) throws Throwable {
        try {
            return method.invoke(target, args);
        } catch (InvocationTargetException e) {
            throw e.getCause();
        }
    }
}
