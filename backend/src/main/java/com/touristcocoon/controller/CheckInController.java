package com.touristcocoon.controller;

import com.touristcocoon.service.CheckInService;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/checkin")
@RequiredArgsConstructor
@Validated
public class CheckInController {

    private final CheckInService checkInService;

    @PostMapping(value = "/{reservationId}", consumes = {"multipart/form-data"})
    public ResponseEntity<?> processCheckIn(
            @PathVariable UUID reservationId,
            @RequestParam("dni")
            @Pattern(regexp = "^[0-9]{8}[A-Za-z]$", message = "Formato de DNI inválido (8 dígitos + 1 letra)")
            String dni,
            @RequestParam(value = "dniPhoto", required = false) MultipartFile dniPhoto) {
        
        try {
            String pin = checkInService.performDigitalCheckIn(
                    reservationId,
                    dni,
                    dniPhoto
            );
            return ResponseEntity.ok(new CheckInResponse("Check-in completado exitosamente.", pin));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Data
    public static class CheckInResponse {
        private final String message;
        private final String accessPin;
    }
}
