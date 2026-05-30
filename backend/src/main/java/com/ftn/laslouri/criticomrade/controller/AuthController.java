package com.ftn.laslouri.criticomrade.controller;

import com.ftn.laslouri.criticomrade.dto.AuthLoginRequest;
import com.ftn.laslouri.criticomrade.dto.AuthRegisterRequest;
import com.ftn.laslouri.criticomrade.dto.AuthResponse;
import com.ftn.laslouri.criticomrade.dto.ForgotPasswordRequest;
import com.ftn.laslouri.criticomrade.dto.MessageResponse;
import com.ftn.laslouri.criticomrade.dto.ResetPasswordRequest;
import com.ftn.laslouri.criticomrade.service.AuthService;
import com.ftn.laslouri.criticomrade.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody AuthRegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthLoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AuthResponse me() {
        return authService.me();
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request.getEmail());
        return new MessageResponse("If an account exists for that email, a reset code has been sent.");
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword());
        return new MessageResponse("Password updated successfully.");
    }
}
