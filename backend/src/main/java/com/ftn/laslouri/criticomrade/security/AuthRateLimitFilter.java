package com.ftn.laslouri.criticomrade.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-address limit on the public auth endpoints, against password and reset-code guessing.
 * In memory, so it counts per instance. Created in SecurityConfig, not as a bean, so it runs
 * inside the security chain after CORS.
 */
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> LIMITED = Set.of(
            "/api/auth/login", "/api/auth/register", "/api/auth/forgot-password", "/api/auth/reset-password");
    private static final int MAX_REQUESTS = 20;
    private static final long WINDOW_MS = 5 * 60 * 1000L;
    private static final int MAX_TRACKED = 50_000;

    private record Window(long start, int count) {
    }

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        if ("POST".equals(request.getMethod()) && LIMITED.contains(request.getRequestURI()) && !allow(request.getRemoteAddr())) {
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(WINDOW_MS / 1000));
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":429,\"message\":\"Too many attempts. Try again later.\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean allow(String address) {
        long now = System.currentTimeMillis();
        if (windows.size() > MAX_TRACKED) {
            windows.values().removeIf(window -> now - window.start() > WINDOW_MS);
        }
        Window current = windows.compute(address, (key, window) ->
                window == null || now - window.start() > WINDOW_MS
                        ? new Window(now, 1)
                        : new Window(window.start(), window.count() + 1));
        return current.count() <= MAX_REQUESTS;
    }
}
