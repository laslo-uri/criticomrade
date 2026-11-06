package com.ftn.laslouri.criticomrade;

import com.ftn.laslouri.criticomrade.exception.BadRequestException;
import com.ftn.laslouri.criticomrade.model.PasswordResetToken;
import com.ftn.laslouri.criticomrade.model.User;
import com.ftn.laslouri.criticomrade.repository.PasswordResetTokenRepository;
import com.ftn.laslouri.criticomrade.repository.UserRepository;
import com.ftn.laslouri.criticomrade.security.JwtService;
import com.ftn.laslouri.criticomrade.service.PasswordResetService;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Date;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class PasswordResetRevokesTokensTests {

    private static final String CODE = "123456";

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordResetTokenRepository resetTokenRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private PasswordResetService passwordResetService;

    private MockMvc mvc;
    private User user;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        String name = "u" + UUID.randomUUID().toString().substring(0, 8);
        user = new User();
        user.setUsername(name);
        user.setEmail(name + "@example.test");
        user.setPassword(passwordEncoder.encode("old-password"));
        user.setRoles(new ArrayList<>());
        user = userRepository.save(user);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setEmail(user.getEmail());
        resetToken.setCodeHash(passwordEncoder.encode(CODE));
        resetToken.setCreatedAt(Instant.now());
        resetToken.setExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
        resetTokenRepository.save(resetToken);
    }

    @Test
    void resetRevokesTokensIssuedBeforeItAndNewOnesWork() throws Exception {
        String before = jwtService.generateToken(user);
        expectMe(before, 200);

        passwordResetService.resetPassword(user.getEmail(), CODE, "new-password");

        expectMe(before, 401);

        User current = userRepository.findById(user.getId()).orElseThrow();
        expectMe(jwtService.generateToken(current), 200);
    }

    @Test
    void failedResetLeavesTokensValid() throws Exception {
        String token = jwtService.generateToken(user);

        assertThrows(BadRequestException.class,
                () -> passwordResetService.resetPassword(user.getEmail(), "000000", "new-password"));

        expectMe(token, 200);
    }

    @Test
    void tokenWithoutVersionClaimIsAcceptedUntilAReset() throws Exception {
        SecretKey key = (SecretKey) ReflectionTestUtils.getField(jwtService, "secretKey");
        String legacy = Jwts.builder()
                .subject(user.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(key)
                .compact();
        expectMe(legacy, 200);

        passwordResetService.resetPassword(user.getEmail(), CODE, "new-password");

        expectMe(legacy, 401);
    }

    private void expectMe(String token, int expectedStatus) throws Exception {
        var result = mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().is(expectedStatus));
        if (expectedStatus == 200) {
            result.andExpect(jsonPath("$.user.username").value(user.getUsername()));
        }
    }
}
