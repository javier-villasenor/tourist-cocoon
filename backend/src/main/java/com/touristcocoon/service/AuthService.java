package com.touristcocoon.service;

import com.touristcocoon.domain.Huesped;
import com.touristcocoon.dto.AuthResponse;
import com.touristcocoon.dto.LoginRequest;
import com.touristcocoon.dto.RegisterRequest;
import com.touristcocoon.repository.GuestRepository;
import com.touristcocoon.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final GuestRepository guestRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse login(LoginRequest request) {
        String dniToSearch = request.getDni().toUpperCase();
        Huesped guest = guestRepository.findById(dniToSearch)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (!passwordEncoder.matches(request.getPassword(), guest.getPassword())) {
            throw new IllegalArgumentException("Contraseña incorrecta");
        }

        String token = jwtService.generateToken(guest.getDni());

        return AuthResponse.builder()
                .token(token)
                .role(guest.getRole())
                .nombre(guest.getFirstName())
                .dni(guest.getDni())
                .build();
    }

    // Regex RFC 5322 simplificada para validar formato de email
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    // Regex para DNI español: exactamente 8 dígitos seguidos de 1 letra
    private static final Pattern DNI_PATTERN = Pattern.compile(
            "^[0-9]{8}[A-Za-z]$");

    @Transactional
    public AuthResponse register(RegisterRequest request) {

        // --- Validaciones de integridad de datos ---
        if (request.getNombre() == null || request.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio.");
        }
        if (request.getApellidos() == null || request.getApellidos().isBlank()) {
            throw new IllegalArgumentException("Los apellidos son obligatorios.");
        }
        if (request.getPassword() == null || request.getPassword().length() < 4) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 4 caracteres.");
        }

        String email = request.getEmail();
        if (email == null || !EMAIL_PATTERN.matcher(email.trim()).matches()) {
            throw new IllegalArgumentException(
                    "El formato del email no es válido. Ejemplo esperado: usuario@dominio.com");
        }

        String dni = request.getDni();
        if (dni == null || !DNI_PATTERN.matcher(dni.trim()).matches()) {
            throw new IllegalArgumentException(
                    "El formato del DNI no es válido. Se requieren 8 números seguidos de 1 letra (ej: 12345678A)");
        }

        // --- Fin validaciones ---

        String dniToRegister = dni.toUpperCase();
        if (guestRepository.existsById(dniToRegister)) {
            throw new IllegalArgumentException("El DNI ya está registrado");
        }

        String finalRole = "USER";
        
        // Lógica automática para el Gestor
        if ("gestor@admin.com".equalsIgnoreCase(request.getEmail()) && "gestor".equals(request.getPassword())) {
            finalRole = "ADMIN";
        } else if (request.getManagerKey() != null && !request.getManagerKey().trim().isEmpty()) {
            if ("Cocooon14".equals(request.getManagerKey())) {
                finalRole = "ADMIN";
            } else {
                throw new IllegalArgumentException("Clave de autorización de gestor inválida.");
            }
        }

        Huesped newGuest = Huesped.builder()
                .dni(dniToRegister)
                .firstName(request.getNombre())
                .lastName(request.getApellidos())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(finalRole)
                .build();

        guestRepository.save(newGuest);

        String token = jwtService.generateToken(newGuest.getDni());

        return AuthResponse.builder()
                .token(token)
                .role(finalRole)
                .nombre(newGuest.getFirstName())
                .dni(newGuest.getDni())
                .build();
    }
}
