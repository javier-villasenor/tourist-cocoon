package com.touristcocoon.config;

import com.touristcocoon.domain.Huesped;
import com.touristcocoon.repository.GuestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final GuestRepository guestRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Crear el Administrador si no existe
        if (!guestRepository.existsById("12345678A")) {
            Huesped admin = Huesped.builder()
                    .dni("12345678A")
                    .firstName("Admin")
                    .lastName("Admin")
                    .email("admin@touristcocoon.com")
                    .password(passwordEncoder.encode("1234"))
                    .role("ADMIN")
                    .build();
            guestRepository.save(admin);
        }

        // Crear un Usuario normal si no existe
        if (!guestRepository.existsById("12345678B")) {
            Huesped user = Huesped.builder()
                    .dni("12345678B")
                    .firstName("User")
                    .lastName("Users")
                    .email("user@user.com")
                    .password(passwordEncoder.encode("1234"))
                    .role("USER")
                    .build();
            guestRepository.save(user);
        }

        System.out.println("Base de datos inicializada con usuarios de prueba");
    }
}