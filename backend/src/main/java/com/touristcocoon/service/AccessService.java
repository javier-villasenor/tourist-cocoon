package com.touristcocoon.service;

import com.touristcocoon.domain.RegistroAcceso;
import com.touristcocoon.domain.Reserva;
import com.touristcocoon.repository.AccessRecordRepository;
import com.touristcocoon.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccessService {

    private final ReservationRepository reservationRepository;
    private final AccessRecordRepository accessRecordRepository;

    @Transactional
    public boolean openCapsuleDoor(UUID capsuleId, String guestDni, String pinSubmitted) {
        
        List<Reserva> activeReservations = reservationRepository.findByCapsulaIdAndStatus(capsuleId, Reserva.EstadoReserva.CHECKIN_HECHO);
        
        Reserva activeReservation = activeReservations.stream()
                .filter(res -> res.getGuest() != null && res.getGuest().getDni().equalsIgnoreCase(guestDni))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No hay una reserva activa (Checked In) para este huésped y cápsula."));

        // Validar el PIN
        if (!activeReservation.getAccessPin().equals(pinSubmitted)) {
            throw new IllegalArgumentException("PIN de acceso incorrecto.");
        }

        // Guardar el registro inalterable de apertura (Auditoría de seguridad)
        RegistroAcceso record = RegistroAcceso.builder()
                .capsuleId(capsuleId)
                .guestDni(guestDni)
                .action(RegistroAcceso.TipoAccion.ABRIR_CAPSULA)
                .timestamp(LocalDateTime.now())
                .build();
                
        accessRecordRepository.save(record);

        // Simulamos envío de señal al IoT de la puerta
        return true; 
    }
}
