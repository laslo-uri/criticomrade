package com.ftn.laslouri.criticomrade.service;

import com.ftn.laslouri.criticomrade.config.PasswordResetProperties;
import com.ftn.laslouri.criticomrade.exception.BadRequestException;
import com.ftn.laslouri.criticomrade.model.PasswordResetToken;
import com.ftn.laslouri.criticomrade.model.User;
import com.ftn.laslouri.criticomrade.repository.PasswordResetTokenRepository;
import com.ftn.laslouri.criticomrade.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final PasswordResetProperties resetProperties;

    @Transactional
    public void requestReset(String email) {
        String normalized = normalizeEmail(email);
        Optional<User> user = findUserByEmail(normalized, email);

        if (user.isEmpty()) {
            return;
        }

        Instant hourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
        long recentRequests = tokenRepository.countByEmailIgnoreCaseAndCreatedAtAfter(normalized, hourAgo);
        if (recentRequests >= resetProperties.getMaxRequestsPerHour()) {
            return;
        }

        tokenRepository.invalidateActiveTokensForEmail(normalized);

        String code = generateOtp();
        PasswordResetToken token = new PasswordResetToken();
        token.setEmail(normalized);
        token.setCodeHash(passwordEncoder.encode(code));
        token.setCreatedAt(Instant.now());
        token.setExpiresAt(Instant.now().plus(resetProperties.getExpiryMinutes(), ChronoUnit.MINUTES));
        tokenRepository.save(token);

        emailService.sendPasswordResetCode(user.get().getEmail(), code, resetProperties.getExpiryMinutes());
    }

    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        String normalized = normalizeEmail(email);

        PasswordResetToken token = tokenRepository
                .findFirstByEmailIgnoreCaseAndUsedFalseOrderByCreatedAtDesc(normalized)
                .orElseThrow(() -> new BadRequestException("Invalid or expired code"));

        if (token.isUsed() || token.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Invalid or expired code");
        }

        if (!passwordEncoder.matches(code, token.getCodeHash())) {
            throw new BadRequestException("Invalid or expired code");
        }

        User user = findUserByEmail(normalized, email)
                .orElseThrow(() -> new BadRequestException("Invalid or expired code"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);
        tokenRepository.invalidateActiveTokensForEmail(normalized);
    }

    private Optional<User> findUserByEmail(String normalized, String original) {
        return userRepository.findByEmailIgnoreCase(normalized)
                .or(() -> userRepository.findByEmail(original.trim()));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private static String generateOtp() {
        int num = 100_000 + RANDOM.nextInt(900_000);
        return String.valueOf(num);
    }
}
