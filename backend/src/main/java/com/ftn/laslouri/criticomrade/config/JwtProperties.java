package com.ftn.laslouri.criticomrade.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "criticomrade.jwt")
public class JwtProperties {

    private String secret;
    private long expirationMs;
    private long rememberExpirationMs;
}
