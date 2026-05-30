package com.ftn.laslouri.criticomrade.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "criticomrade.password-reset")
public class PasswordResetProperties {

    /** OTP validity in minutes */
    private int expiryMinutes = 15;

    /** Max reset requests per email per hour */
    private int maxRequestsPerHour = 3;
}
