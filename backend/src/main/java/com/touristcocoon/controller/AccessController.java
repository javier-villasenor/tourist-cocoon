package com.touristcocoon.controller;

import com.touristcocoon.service.AccessService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/access")
@RequiredArgsConstructor
public class AccessController {

    private final AccessService accessService;

    @PostMapping("/open")
    public ResponseEntity<?> openCapsuleDoor(@Valid @RequestBody AccessRequest request) {
        try {
            boolean success = accessService.openCapsuleDoor(
                    request.getCapsuleId(),
                    request.getGuestDni(),
                    request.getPin()
            );
            if (success) {
                return ResponseEntity.ok("Puerta desbloqueada correctamente.");
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No se pudo abrir la puerta.");
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @Data
    public static class AccessRequest {
        @NotNull(message = "El ID de la cápsula es obligatorio")
        private UUID capsuleId;

        @NotBlank(message = "El DNI del huésped es obligatorio")
        @Pattern(regexp = "^[0-9]{8}[A-Za-z]$", message = "Formato de DNI inválido (8 dígitos + 1 letra)")
        private String guestDni;

        @NotBlank(message = "El PIN es obligatorio")
        @Pattern(regexp = "^[0-9]{6}$", message = "El PIN debe tener exactamente 6 dígitos numéricos")
        private String pin;
    }
}
