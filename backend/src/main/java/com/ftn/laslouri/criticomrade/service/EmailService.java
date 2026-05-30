package com.ftn.laslouri.criticomrade.service;

import com.ftn.laslouri.criticomrade.config.MailProperties;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final MailProperties mailProperties;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendPasswordResetCode(String to, String code, int expiryMinutes) {
        String subject = "CritiComrade – password reset code";
        String body = """
                You requested a password reset for your CritiComrade account.

                Your one-time code: %s

                This code expires in %d minutes. If you did not request this, you can ignore this email.
                """.formatted(code, expiryMinutes);

        if (mailProperties.isConfigured() && mailSender != null) {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailProperties.getFrom());
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Password reset email sent to {}", to);
        } else {
            log.warn("=== PASSWORD RESET (SMTP not configured – dev fallback) ===");
            log.warn("Email: {}", to);
            log.warn("Code: {}", code);
            log.warn("Expires in {} minutes", expiryMinutes);
        }
    }
}
