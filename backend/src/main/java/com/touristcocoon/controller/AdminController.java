package com.touristcocoon.controller;

import com.touristcocoon.domain.Capsula;
import com.touristcocoon.domain.Incidencia;
import com.touristcocoon.domain.Reserva;
import com.touristcocoon.domain.RegistroAcceso;
import com.touristcocoon.repository.CapsuleRepository;
import com.touristcocoon.repository.GuestRepository;
import com.touristcocoon.repository.IncidenciaRepository;
import com.touristcocoon.repository.ReservationRepository;
import com.touristcocoon.repository.AccessRecordRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final CapsuleRepository capsuleRepository;
    private final ReservationRepository reservationRepository;
    private final GuestRepository guestRepository;
    private final AccessRecordRepository accessRecordRepository;
    private final IncidenciaRepository incidenciaRepository;

    @GetMapping("/dashboard")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getDashboardMetrics() {
        long totalCapsules = capsuleRepository.count();
        LocalDate today = LocalDate.now();

        // Cápsulas ocupadas = cápsulas distintas con reserva CHECKIN_HECHO cuyo rango incluye hoy
        long occupiedCapsules = reservationRepository.countDistinctOccupiedCapsules(
                Reserva.EstadoReserva.CHECKIN_HECHO, today);

        long freeCapsules = totalCapsules - occupiedCapsules;

        long activeReservations = reservationRepository.countByStatusAndDateRange(
                Reserva.EstadoReserva.CHECKIN_HECHO, today);

        long futureReservations = reservationRepository.countByStatusIn(
                List.of(Reserva.EstadoReserva.PENDIENTE, Reserva.EstadoReserva.CONFIRMADA));

        long totalReservations = reservationRepository.count();

        long pendingIncidents = incidenciaRepository.countByStatusIn(
                List.of(Incidencia.EstadoIncidencia.PENDIENTE, Incidencia.EstadoIncidencia.ASIGNADA));

        return ResponseEntity.ok(new DashboardMetrics(
                totalCapsules, occupiedCapsules, freeCapsules,
                activeReservations, futureReservations, totalReservations, pendingIncidents));
    }

    @GetMapping("/audit-calendar")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAuditCalendar() {
        List<Capsula> allCapsules = capsuleRepository.findAll();

        List<AuditCapsuleDTO> auditData = allCapsules.stream().map(capsula -> {
            // Consulta de reservas filtrada por cápsula (con JOIN FETCH para evitar N+1)
            List<AuditReservationDTO> resList = reservationRepository
                    .findByCapsulaIdWithGuest(capsula.getId()).stream()
                    .map(r -> new AuditReservationDTO(
                            r.getStartDate(),
                            r.getEndDate(),
                            r.getStatus().name(),
                            r.getGuest() != null
                                    ? r.getGuest().getFirstName() + " " + r.getGuest().getLastName()
                                    : "Desconocido"
                    )).collect(Collectors.toList());

            // Consulta de logs filtrada por cápsula
            List<AuditLogDTO> logList = accessRecordRepository
                    .findByCapsuleIdOrderByTimestampDesc(capsula.getId()).stream()
                    .map(l -> new AuditLogDTO(
                            l.getTimestamp().toString(),
                            l.getAction().name(),
                            l.getGuestDni()
                    )).collect(Collectors.toList());

            return new AuditCapsuleDTO(
                    capsula.getId(),
                    capsula.getRoomNumber(),
                    capsula.getStatus().name(),
                    resList,
                    logList
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(auditData);
    }

    @PostMapping("/capsules")
    public ResponseEntity<?> createCapsule(@Valid @RequestBody CapsuleRequest request) {
        if (capsuleRepository.findByRoomNumber(request.getRoomNumber()).isPresent()) {
            return ResponseEntity.badRequest().body("La habitación con número " + request.getRoomNumber() + " ya existe.");
        }

        Capsula cap = Capsula.builder()
                .roomNumber(request.getRoomNumber())
                .build();

        capsuleRepository.save(cap);
        return ResponseEntity.ok("Cápsula creada exitosamente.");
    }

    @PutMapping("/capsules/{id}/status")
    @Transactional
    public ResponseEntity<?> updateCapsuleStatus(@PathVariable UUID id, @Valid @RequestBody UpdateCapsuleStatusRequest request) {
        var capOpt = capsuleRepository.findById(id);
        if (capOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cápsula no encontrada.");
        }
        var cap = capOpt.get();
        cap.setStatus(request.getStatus());
        capsuleRepository.save(cap);
        return ResponseEntity.ok("Estado de la cápsula actualizado.");
    }

    @GetMapping("/active-guests")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getActiveGuests() {
        List<Reserva.EstadoReserva> activeStatuses = List.of(
                Reserva.EstadoReserva.CONFIRMADA,
                Reserva.EstadoReserva.CHECKIN_HECHO);

        List<ActiveGuestDTO> activeGuests = reservationRepository
                .findByStatusInWithGuestAndCapsule(activeStatuses).stream()
                .map(r -> {
                    String firstName = "Desconocido";
                    String lastName = "";
                    String dni = null;
                    if (r.getGuest() != null) {
                        firstName = r.getGuest().getFirstName();
                        lastName = r.getGuest().getLastName();
                        dni = r.getGuest().getDni();
                    }

                    Integer roomNumber = null;
                    if (r.getCapsula() != null) {
                        roomNumber = r.getCapsula().getRoomNumber();
                    }

                    return new ActiveGuestDTO(
                            dni,
                            firstName,
                            lastName,
                            r.getId(),
                            roomNumber,
                            r.getStartDate(),
                            r.getEndDate(),
                            r.getStatus().name()
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(activeGuests);
    }

    @GetMapping("/future-reservations")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getFutureReservations() {
        List<Reserva.EstadoReserva> futureStatuses = List.of(
                Reserva.EstadoReserva.PENDIENTE,
                Reserva.EstadoReserva.CONFIRMADA);

        List<ActiveGuestDTO> futureReservations = reservationRepository
                .findByStatusInWithGuestAndCapsule(futureStatuses).stream()
                .map(r -> {
                    String firstName = "Desconocido";
                    String lastName = "";
                    String dni = null;
                    if (r.getGuest() != null) {
                        firstName = r.getGuest().getFirstName();
                        lastName = r.getGuest().getLastName();
                        dni = r.getGuest().getDni();
                    }

                    Integer roomNumber = null;
                    if (r.getCapsula() != null) {
                        roomNumber = r.getCapsula().getRoomNumber();
                    }

                    return new ActiveGuestDTO(
                            dni,
                            firstName,
                            lastName,
                            r.getId(),
                            roomNumber,
                            r.getStartDate(),
                            r.getEndDate(),
                            r.getStatus().name()
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(futureReservations);
    }

    @GetMapping("/guests/search")
    @Transactional(readOnly = true)
    public ResponseEntity<?> searchGuests(@RequestParam(required = false) String q) {
        List<GuestProfileDTO> results;
        if (q == null || q.trim().isEmpty()) {
            results = guestRepository.findAll().stream()
                    .map(guest -> new GuestProfileDTO(
                            guest.getDni(),
                            guest.getFirstName(),
                            guest.getLastName(),
                            guest.getEmail(),
                            guest.getRole(),
                            List.of()
                    ))
                    .collect(Collectors.toList());
        } else {
            results = guestRepository
                    .findByDniContainingIgnoreCaseOrLastNameContainingIgnoreCase(q, q)
                    .stream()
                    .map(guest -> new GuestProfileDTO(
                            guest.getDni(),
                            guest.getFirstName(),
                            guest.getLastName(),
                            guest.getEmail(),
                            guest.getRole(),
                            List.of()
                    ))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(results);
    }

    @GetMapping("/guests/{dni}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getGuestProfile(@PathVariable String dni) {
        var guestOpt = guestRepository.findById(dni);
        if (guestOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Huésped no encontrado.");
        }
        var guest = guestOpt.get();

        List<ReservationDTO> resList = reservationRepository.findByGuestDniIgnoreCase(dni).stream()
                .map(r -> new ReservationDTO(
                        r.getId(),
                        r.getCapsula() != null ? r.getCapsula().getRoomNumber() : null,
                        r.getStartDate(),
                        r.getEndDate(),
                        r.getStatus().name()
                ))
                .collect(Collectors.toList());

        GuestProfileDTO profile = new GuestProfileDTO(
                guest.getDni(),
                guest.getFirstName(),
                guest.getLastName(),
                guest.getEmail(),
                guest.getRole(),
                resList
        );

        return ResponseEntity.ok(profile);
    }

    @PutMapping("/guests/{dni}")
    @Transactional
    public ResponseEntity<?> updateGuestProfile(@PathVariable String dni, @Valid @RequestBody UpdateGuestRequest request) {
        var guestOpt = guestRepository.findById(dni);
        if (guestOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Huésped no encontrado.");
        }

        var guest = guestOpt.get();
        guest.setFirstName(request.getFirstName());
        guest.setLastName(request.getLastName());
        guest.setEmail(request.getEmail());

        guestRepository.save(guest);

        return ResponseEntity.ok("Datos del huésped actualizados correctamente.");
    }

    @Data
    public static class DashboardMetrics {
        private final long totalCapsules;
        private final long occupiedCapsules;
        private final long freeCapsules;
        private final long activeReservations;
        private final long futureReservations;
        private final long totalReservations;
        private final long pendingIncidents;
    }

    @Data
    public static class CapsuleRequest {
        @Positive(message = "El número de habitación debe ser un número positivo")
        private int roomNumber;
    }

    @Data
    public static class ActiveGuestDTO {
        private final String dni;
        private final String firstName;
        private final String lastName;
        private final UUID reservationId;
        private final Integer roomNumber;
        private final LocalDate startDate;
        private final LocalDate endDate;
        private final String status;
    }

    @Data
    public static class GuestProfileDTO {
        private final String dni;
        private final String firstName;
        private final String lastName;
        private final String email;
        private final String role;
        private final List<ReservationDTO> reservations;
    }

    @Data
    public static class ReservationDTO {
        private final UUID id;
        private final Integer roomNumber;
        private final LocalDate startDate;
        private final LocalDate endDate;
        private final String status;
    }

    @Data
    public static class UpdateGuestRequest {
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
        private String firstName;

        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 150, message = "Los apellidos no pueden exceder 150 caracteres")
        private String lastName;

        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El formato del email no es válido")
        private String email;
    }

    @Data
    public static class AuditCapsuleDTO {
        private final UUID capsuleId;
        private final Integer roomNumber;
        private final String status;
        private final List<AuditReservationDTO> reservations;
        private final List<AuditLogDTO> accessLogs;
    }

    @Data
    public static class AuditReservationDTO {
        private final LocalDate startDate;
        private final LocalDate endDate;
        private final String status;
        private final String guestName;
    }

    @Data
    public static class AuditLogDTO {
        private final String timestamp;
        private final String action;
        private final String guestDni;
    }

    // ── INCIDENCIAS ──

    @GetMapping("/incidents")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAllIncidents() {
        List<AdminIncidentDTO> incidents = incidenciaRepository.findAllWithDetails().stream()
                .map(i -> new AdminIncidentDTO(
                        i.getId(),
                        i.getReserva().getCapsula() != null ? i.getReserva().getCapsula().getRoomNumber() : null,
                        i.getGuest().getFirstName() + " " + i.getGuest().getLastName(),
                        i.getGuest().getDni(),
                        i.getCategory().name(),
                        i.getDescription(),
                        i.getStatus().name(),
                        i.getCreatedAt().toString(),
                        i.getResolvedAt() != null ? i.getResolvedAt().toString() : null,
                        i.getReserva().getId(),
                        i.getReserva().getStartDate(),
                        i.getReserva().getEndDate()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(incidents);
    }

    @GetMapping("/incidents/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getIncidentDetail(@PathVariable UUID id) {
        var incOpt = incidenciaRepository.findByIdWithDetails(id);
        if (incOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Incidencia no encontrada.");
        }
        var i = incOpt.get();
        AdminIncidentDTO dto = new AdminIncidentDTO(
                i.getId(),
                i.getReserva().getCapsula() != null ? i.getReserva().getCapsula().getRoomNumber() : null,
                i.getGuest().getFirstName() + " " + i.getGuest().getLastName(),
                i.getGuest().getDni(),
                i.getCategory().name(),
                i.getDescription(),
                i.getStatus().name(),
                i.getCreatedAt().toString(),
                i.getResolvedAt() != null ? i.getResolvedAt().toString() : null,
                i.getReserva().getId(),
                i.getReserva().getStartDate(),
                i.getReserva().getEndDate()
        );
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/incidents/{id}/status")
    @Transactional
    public ResponseEntity<?> updateIncidentStatus(@PathVariable UUID id, @Valid @RequestBody UpdateIncidentStatusRequest request) {
        var incOpt = incidenciaRepository.findById(id);
        if (incOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Incidencia no encontrada.");
        }

        var incident = incOpt.get();
        incident.setStatus(request.getStatus());

        if (request.getStatus() == Incidencia.EstadoIncidencia.COMPLETADA) {
            incident.setResolvedAt(LocalDateTime.now());
        }

        incidenciaRepository.save(incident);
        return ResponseEntity.ok("Estado de la incidencia actualizado.");
    }

    @Data
    public static class AdminIncidentDTO {
        private final UUID id;
        private final Integer roomNumber;
        private final String guestName;
        private final String guestDni;
        private final String category;
        private final String description;
        private final String status;
        private final String createdAt;
        private final String resolvedAt;
        private final UUID reservationId;
        private final LocalDate reservationStartDate;
        private final LocalDate reservationEndDate;
    }

    @Data
    public static class UpdateIncidentStatusRequest {
        @NotNull(message = "El estado de la incidencia es obligatorio")
        private Incidencia.EstadoIncidencia status;
    }

    @Data
    public static class UpdateCapsuleStatusRequest {
        @NotNull(message = "El estado de la cápsula es obligatorio")
        private Capsula.EstadoCapsula status;
    }
}
