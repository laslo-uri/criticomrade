package com.ftn.laslouri.criticomrade.config;

import com.ftn.laslouri.criticomrade.model.Role;
import com.ftn.laslouri.criticomrade.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class RoleDataInitializer implements ApplicationRunner {

    private static final String[] DEFAULT_ROLES = {
            "ROLE_SYSTEM_ADMIN",
            "ROLE_USER",
            "ROLE_COMMON"
    };

    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (String roleName : DEFAULT_ROLES) {
            roleRepository.findByName(roleName).orElseGet(() -> {
                Role role = new Role();
                role.setName(roleName);
                return roleRepository.save(role);
            });
        }
    }
}
