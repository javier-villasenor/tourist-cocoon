package com.touristcocoon.service;

import com.touristcocoon.domain.Huesped;
import com.touristcocoon.domain.Reserva;
import com.touristcocoon.repository.GuestRepository;
import com.touristcocoon.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;
import java.security.SecureRandom;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class CheckInService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final ReservationRepository reservationRepository;
    private final GuestRepository guestRepository;

    @Transactional
    public String performDigitalCheckIn(UUID reservationId, String scannedDni, MultipartFile dniPhoto) {
        
        // --- VALIDACIÓN ESTRICTA ---
        if (!StringUtils.hasText(scannedDni)) {
            throw new IllegalArgumentException("El DNI es obligatorio para hacer el check-in.");
        }
        
        if (dniPhoto == null || dniPhoto.isEmpty()) {
            throw new IllegalArgumentException("Es obligatorio subir una foto del DNI escaneado por normativa vigente.");
        }
        
        Reserva reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));

        if (!reservation.getGuest().getDni().equalsIgnoreCase(scannedDni)) {
            throw new IllegalArgumentException("El DNI proporcionado no coincide con la reserva.");
        }

        if (reservation.getStatus() == Reserva.EstadoReserva.CHECKIN_HECHO) {
            throw new IllegalStateException("El Check-in ya fue realizado previamente.");
        }

        if (reservation.getStatus() == Reserva.EstadoReserva.CANCELADA) {
            throw new IllegalStateException("No se puede hacer check-in de una reserva cancelada.");
        }

        if (reservation.getStatus() == Reserva.EstadoReserva.COMPLETADA) {
            throw new IllegalStateException("Esta reserva ya fue completada.");
        }

        if (LocalDate.now().isBefore(reservation.getStartDate())) {
            throw new IllegalStateException("No puedes hacer el check-in antes de la fecha de inicio de tu reserva.");
        }
        
        // --- GUARDADO DE ARCHIVOS ---
        try {
            String originalFileName = StringUtils.cleanPath(dniPhoto.getOriginalFilename() != null ? dniPhoto.getOriginalFilename() : "dni.jpg");
            String storedFileName = reservationId.toString() + "_" + originalFileName;
            Path uploadPath = Paths.get("uploads");
            
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            Path filePath = uploadPath.resolve(storedFileName);
            Files.copy(dniPhoto.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            reservation.setDniPhotoPath(filePath.toString());
            
        } catch (Exception ex) {
            throw new IllegalStateException("Error al guardar la foto del DNI: " + ex.getMessage());
        }

        // El huésped ya existe obligatoriamente, no necesitamos actualizar sus datos aquí

        // Generar PIN único de 6 cifras
        String rawPin = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        
        reservation.setAccessPin(rawPin);
        reservation.setStatus(Reserva.EstadoReserva.CHECKIN_HECHO);
        reservationRepository.save(reservation);

        return rawPin;
    }
}
