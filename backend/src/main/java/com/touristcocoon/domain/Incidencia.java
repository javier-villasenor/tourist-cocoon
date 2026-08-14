package com.touristcocoon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "incidents")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incidencia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Reserva reserva;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_dni", referencedColumnName = "dni", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Huesped guest;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CategoriaIncidencia category;

    @Column(name = "description", length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoIncidencia status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public enum CategoriaIncidencia {
        LIMPIEZA,
        AVERIA,
        RUIDO,
        CLIMA,
        OTRO
    }

    public enum EstadoIncidencia {
        PENDIENTE,
        ASIGNADA,
        COMPLETADA
    }
}
