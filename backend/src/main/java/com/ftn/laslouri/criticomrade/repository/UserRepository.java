package com.ftn.laslouri.criticomrade.repository;

import com.ftn.laslouri.criticomrade.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Page<User> findByUsernameContainingIgnoreCaseOrFullNameContainingIgnoreCase(
            String username, String fullName, Pageable pageable);
}
