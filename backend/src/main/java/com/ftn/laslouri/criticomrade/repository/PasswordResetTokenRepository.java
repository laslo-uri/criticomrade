package com.ftn.laslouri.criticomrade.repository;

import com.ftn.laslouri.criticomrade.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findFirstByEmailIgnoreCaseAndUsedFalseOrderByCreatedAtDesc(String email);

    long countByEmailIgnoreCaseAndCreatedAtAfter(String email, Instant since);

    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.used = true WHERE t.email = :email AND t.used = false")
    void invalidateActiveTokensForEmail(String email);

    List<PasswordResetToken> findByEmailIgnoreCaseAndUsedFalseAndExpiresAtAfter(String email, Instant now);
}
