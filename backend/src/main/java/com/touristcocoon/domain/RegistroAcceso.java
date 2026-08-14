package com.touristcocoon.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "access_records")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroAcceso {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(name = "guest_dni", nullable = false, length = 20, updatable = false)
    private String guestDni;

    @Column(name = "capsule_id", nullable = false, updatable = false)
    private UUID capsuleId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, updatable = false)
    private TipoAccion action;

    public enum TipoAccion {
        ABRIR_CAPSULA,
        CERRAR_CAPSULA,
        ABRIR_EDIFICIO
    }
}
