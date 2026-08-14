package com.touristcocoon.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "capsules")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Capsula {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_number", nullable = false, unique = true)
    private int roomNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private EstadoCapsula status = EstadoCapsula.DISPONIBLE;

    public enum EstadoCapsula {
        DISPONIBLE,
        OCUPADA,
        PENDIENTE_LIMPIEZA
    }
}
