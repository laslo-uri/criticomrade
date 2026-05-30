package com.ftn.laslouri.criticomrade.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Pattern(regexp = "\\d{6}", message = "Code must be 6 digits")
    private String code;

    @NotBlank
    @Size(min = 6, max = 100)
    private String newPassword;
}
