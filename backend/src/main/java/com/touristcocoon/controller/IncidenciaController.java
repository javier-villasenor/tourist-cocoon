package com.touristcocoon.controller;

import com.touristcocoon.domain.Huesped;
import com.touristcocoon.domain.Incidencia;
import com.touristcocoon.domain.Reserva;
import com.touristcocoon.repository.GuestRepository;
import com.touristcocoon.repository.IncidenciaRepository;
import com.touristcocoon.repository.ReservationRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
public class IncidenciaController {

    private final IncidenciaRepository incidenciaRepository;
    private final ReservationRepository reservationRepository;
    private final GuestRepository guestRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<?> createIncident(@Valid @RequestBody CreateIncidentRequest request) {
        String principalDni = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Huesped guest = guestRepository.findById(principalDni)
                .orElseThrow(() -> new IllegalArgumentException("Huésped no encontrado."));

        Reserva reserva = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada."));

        // Verificar que la reserva pertenece al usuario autenticado
        if (!reserva.getGuest().getDni().equalsIgnoreCase(principalDni)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("No puedes reportar una incidencia para una reserva que no es tuya.");
        }

        // Verificar que la reserva está activa (CHECKIN_HECHO)
        if (reserva.getStatus() != Reserva.EstadoReserva.CHECKIN_HECHO) {
            return ResponseEntity.badRequest()
                    .body("Solo puedes reportar incidencias de reservas con check-in realizado.");
        }

        Incidencia incidencia = Incidencia.builder()
                .reserva(reserva)
                .guest(guest)
                .category(request.getCategory())
                .description(request.getDescription())
                .status(Incidencia.EstadoIncidencia.PENDIENTE)
                .createdAt(LocalDateTime.now())
                .build();

        incidenciaRepository.save(incidencia);

        return ResponseEntity.status(HttpStatus.CREATED).body("Incidencia reportada correctamente.");
    }

    @GetMapping("/my")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyIncidents() {
        String principalDni = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        List<IncidentDTO> incidents = incidenciaRepository.findByGuestDniWithDetails(principalDni).stream()
                .map(i -> new IncidentDTO(
                        i.getId(),
                        i.getReserva().getCapsula() != null ? i.getReserva().getCapsula().getRoomNumber() : null,
                        i.getCategory().name(),
                        i.getDescription(),
                        i.getStatus().name(),
                        i.getCreatedAt().toString(),
                        i.getResolvedAt() != null ? i.getResolvedAt().toString() : null
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(incidents);
    }

    @Data
    public static class CreateIncidentRequest {
        @NotNull(message = "El ID de la reserva es obligatorio")
        private UUID reservationId;

        @NotNull(message = "La categoría de la incidencia es obligatoria")
        private Incidencia.CategoriaIncidencia category;

        @NotBlank(message = "La descripción de la incidencia es obligatoria")
        @Size(min = 5, max = 1000, message = "La descripción debe tener entre 5 y 1000 caracteres")
        private String description;
    }

    @Data
    public static class IncidentDTO {
        private final UUID id;
        private final Integer roomNumber;
        private final String category;
        private final String description;
        private final String status;
        private final String createdAt;
        private final String resolvedAt;
    }
}
