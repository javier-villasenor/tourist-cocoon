package com.touristcocoon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reservations")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_dni", referencedColumnName = "dni", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Huesped guest;

    // Relación con la cápsula
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capsule_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Capsula capsula;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    // PIN de 6 cifras generado para acceso (se desbloquea tras el Check-in)
    @Column(name = "access_pin", length = 6)
    private String accessPin;

    @Column(name = "dni_photo_path")
    private String dniPhotoPath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoReserva status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public enum EstadoReserva {
        PENDIENTE,     // Creada pero sin pagar o confirmar
        CONFIRMADA,    // Pagada y confirmada, pendiente de check-in
        CHECKIN_HECHO, // Check-in digital completado (PIN Activo)
        COMPLETADA,    // Estancia finalizada
        CANCELADA      // Cancelada
    }
}
