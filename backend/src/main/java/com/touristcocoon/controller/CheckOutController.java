package com.touristcocoon.controller;

import com.touristcocoon.domain.Reserva;
import com.touristcocoon.service.CheckOutService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/checkout")
@RequiredArgsConstructor
public class CheckOutController {

    private final CheckOutService checkOutService;

    /**
     * GET /api/v1/checkout/by-dni/{dni}
     * Obtiene el resumen de la reserva activa (CHECKIN_HECHO) para mostrar antes de confirmar.
     */
    @GetMapping("/by-dni/{dni}")
    public ResponseEntity<?> getReservationSummary(@PathVariable String dni) {
        try {
            java.util.List<Reserva> reservations = checkOutService.getActiveCheckedInReservations(dni);
            if (reservations.isEmpty()) {
                return ResponseEntity.status(404).body("No se encontraron reservas con check-in activo para este DNI.");
            }
            return ResponseEntity.ok(reservations);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /**
     * POST /api/v1/checkout/{reservationId}
     * Confirma el check-out de la reserva.
     */
    @PostMapping("/{reservationId}")
    public ResponseEntity<?> processCheckOut(
            @PathVariable UUID reservationId,
            @Valid @RequestBody CheckOutRequest request) {
        try {
            Reserva completed = checkOutService.performCheckOut(reservationId, request.getGuestDni());
            return ResponseEntity.ok(new CheckOutResponse(
                    "Check-out completado correctamente. ¡Hasta pronto!",
                    completed.getId(),
                    completed.getGuest().getDni(),
                    completed.getStartDate().toString(),
                    completed.getEndDate().toString()
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Data
    public static class CheckOutRequest {
        @NotBlank(message = "El DNI del huésped es obligatorio")
        @Pattern(regexp = "^[0-9]{8}[A-Za-z]$", message = "Formato de DNI inválido (8 dígitos + 1 letra)")
        private String guestDni;
    }

    @Data
    public static class CheckOutResponse {
        private final String message;
        private final UUID reservationId;
        private final String guestDni;
        private final String startDate;
        private final String endDate;
    }
}
