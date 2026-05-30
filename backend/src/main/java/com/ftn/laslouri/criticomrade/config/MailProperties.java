package com.ftn.laslouri.criticomrade.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "criticomrade.mail")
public class MailProperties {

    private String host = "";
    private int port = 587;
    private String username = "";
    private String password = "";
    private String from = "noreply@criticomrade.app";

    public boolean isConfigured() {
        return host != null && !host.isBlank();
    }
}
