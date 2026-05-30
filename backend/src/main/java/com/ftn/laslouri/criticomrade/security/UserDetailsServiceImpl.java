package com.ftn.laslouri.criticomrade.security;

import com.ftn.laslouri.criticomrade.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        if (usernameOrEmail.contains("@")) {
            return userRepository.findByEmail(usernameOrEmail)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + usernameOrEmail));
        }
        return userRepository.findByUsername(usernameOrEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + usernameOrEmail));
    }
}
