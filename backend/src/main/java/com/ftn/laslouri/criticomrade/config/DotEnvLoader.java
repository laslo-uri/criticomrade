package com.ftn.laslouri.criticomrade.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

/**
 * Loads key=value pairs from a {@code .env} file at the monorepo root (or cwd).
 * Does not override variables already set in the process environment.
 */
public final class DotEnvLoader {

    private static final List<String> CANDIDATE_PATHS = List.of(".env", "../.env");

    private DotEnvLoader() {
    }

    public static void load() {
        findEnvFile().ifPresent(DotEnvLoader::loadFile);
    }

    private static java.util.Optional<Path> findEnvFile() {
        Path cwd = Path.of("").toAbsolutePath().normalize();
        for (String candidate : CANDIDATE_PATHS) {
            Path file = cwd.resolve(candidate).normalize();
            if (Files.isRegularFile(file)) {
                return java.util.Optional.of(file);
            }
        }
        return java.util.Optional.empty();
    }

    private static void loadFile(Path file) {
        try (Stream<String> lines = Files.lines(file, StandardCharsets.UTF_8)) {
            lines.map(String::trim)
                    .filter(line -> !line.isEmpty() && !line.startsWith("#"))
                    .forEach(DotEnvLoader::applyLine);
        } catch (IOException ignored) {
            // optional file
        }
    }

    private static void applyLine(String line) {
        int eq = line.indexOf('=');
        if (eq <= 0) {
            return;
        }
        String key = line.substring(0, eq).trim();
        String value = stripQuotes(line.substring(eq + 1).trim());
        if (key.isEmpty()) {
            return;
        }
        if (System.getenv(key) == null) {
            System.setProperty(key, value);
        }
    }

    private static String stripQuotes(String value) {
        if (value.length() >= 2
                && ((value.startsWith("\"") && value.endsWith("\""))
                        || (value.startsWith("'") && value.endsWith("'")))) {
            return value.substring(1, value.length() - 1);
        }
        return value;
    }
}
