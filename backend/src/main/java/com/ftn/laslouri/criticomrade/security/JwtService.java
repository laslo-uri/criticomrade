package com.ftn.laslouri.criticomrade.security;

import com.ftn.laslouri.criticomrade.config.JwtProperties;
import com.ftn.laslouri.criticomrade.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private static final String TOKEN_VERSION_CLAIM = "tv";

    private final JwtProperties jwtProperties;
    private final SecretKey secretKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.secretKey = buildKey(requireRealSecret(jwtProperties.getSecret()));
    }

    public String generateToken(User user) {
        return generateToken(user, true);
    }

    public String generateToken(User user, boolean rememberMe) {
        Date now = new Date();
        long ttl = rememberMe ? jwtProperties.getRememberExpirationMs() : jwtProperties.getExpirationMs();
        Date expiry = new Date(now.getTime() + ttl);
        return Jwts.builder()
                .subject(user.getUsername())
                .claim(TOKEN_VERSION_CLAIM, user.getTokenVersion())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, User user) {
        Claims claims = parseClaims(token);
        // A token from before this claim existed counts as version 0, so the next reset revokes it too.
        Integer version = claims.get(TOKEN_VERSION_CLAIM, Integer.class);
        int tokenVersion = version == null ? 0 : version;
        return claims.getSubject().equals(user.getUsername())
                && tokenVersion == user.getTokenVersion()
                && !claims.getExpiration().before(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** A signing key that is public (empty, or a placeholder from the repo) lets anyone forge tokens. */
    private static String requireRealSecret(String secret) {
        if (secret == null || secret.isBlank() || secret.startsWith("change-me") || secret.startsWith("replace-with")) {
            throw new IllegalStateException("JWT_SECRET must be set to a long random value");
        }
        return secret;
    }

    private SecretKey buildKey(String secret) {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (RuntimeException ex) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
