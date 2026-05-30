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

    private final JwtProperties jwtProperties;
    private final SecretKey secretKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.secretKey = buildKey(jwtProperties.getSecret());
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
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, User user) {
        String username = extractUsername(token);
        return username.equals(user.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return parseClaims(token).getExpiration().before(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
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
