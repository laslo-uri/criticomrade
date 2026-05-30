package com.ftn.laslouri.criticomrade.service;

import com.ftn.laslouri.criticomrade.dto.AuthLoginRequest;
import com.ftn.laslouri.criticomrade.dto.AuthRegisterRequest;
import com.ftn.laslouri.criticomrade.dto.AuthResponse;
import com.ftn.laslouri.criticomrade.exception.BadRequestException;
import com.ftn.laslouri.criticomrade.mapper.DtoMapper;
import com.ftn.laslouri.criticomrade.model.Role;
import com.ftn.laslouri.criticomrade.model.User;
import com.ftn.laslouri.criticomrade.repository.RoleRepository;
import com.ftn.laslouri.criticomrade.repository.UserRepository;
import com.ftn.laslouri.criticomrade.security.JwtService;
import com.ftn.laslouri.criticomrade.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final SecurityUtils securityUtils;

    @Transactional
    public AuthResponse register(AuthRegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setProfilePublic(true);

        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> roleRepository.findByName("ROLE_COMMON")
                        .orElseThrow(() -> new BadRequestException("Default role not found")));
        user.setRoles(new ArrayList<>(List.of(userRole)));

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved);
        return AuthResponse.builder()
                .token(token)
                .user(DtoMapper.toUserProfile(saved))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(AuthLoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword()));

        boolean rememberMe = Boolean.TRUE.equals(request.getRememberMe());
        String token = jwtService.generateToken(user, rememberMe);
        return AuthResponse.builder()
                .token(token)
                .user(DtoMapper.toUserProfile(user))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse me() {
        User user = securityUtils.getCurrentUser();
        return AuthResponse.builder()
                .user(DtoMapper.toUserProfile(user))
                .build();
    }
}
