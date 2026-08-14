package com.touristcocoon.repository;

import com.touristcocoon.domain.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reserva, UUID> {
    List<Reserva> findByGuestDniIgnoreCase(String guestDni);
    List<Reserva> findByCapsulaIdAndStatus(UUID capsuleId, Reserva.EstadoReserva status);

    // Para validar ocupación de una cápsula en un rango de fechas
    List<Reserva> findByCapsulaIdAndStartDateLessThanEqualAndEndDateGreaterThanEqualAndStatusNot(
        UUID capsuleId, LocalDate end, LocalDate start, Reserva.EstadoReserva status
    );

    // --- Métodos para el Dashboard (delegan filtrado a la BD) ---

    /** Cápsulas distintas ocupadas: status = CHECKIN_HECHO y rango incluye la fecha dada */
    @Query("SELECT COUNT(DISTINCT r.capsula.id) FROM Reserva r " +
           "WHERE r.status = :status AND r.startDate <= :date AND r.endDate >= :date")
    long countDistinctOccupiedCapsules(@Param("status") Reserva.EstadoReserva status,
                                       @Param("date") LocalDate date);

    /** Reservas activas: por estado y rango de fechas */
    @Query("SELECT COUNT(r) FROM Reserva r " +
           "WHERE r.status = :status AND r.startDate <= :date AND r.endDate >= :date")
    long countByStatusAndDateRange(@Param("status") Reserva.EstadoReserva status,
                                   @Param("date") LocalDate date);

    /** Reservas futuras: conteo por múltiples estados */
    long countByStatusIn(Collection<Reserva.EstadoReserva> statuses);

    // --- Métodos para Active Guests y Audit Calendar ---

    /** Huéspedes activos: reservas con estados CONFIRMADA o CHECKIN_HECHO (fetch join para evitar N+1) */
    @Query("SELECT r FROM Reserva r JOIN FETCH r.guest JOIN FETCH r.capsula " +
           "WHERE r.status IN :statuses")
    List<Reserva> findByStatusInWithGuestAndCapsule(@Param("statuses") Collection<Reserva.EstadoReserva> statuses);

    /** Reservas por cápsula (fetch join con guest para evitar N+1 en audit-calendar) */
    @Query("SELECT r FROM Reserva r JOIN FETCH r.guest WHERE r.capsula.id = :capsuleId")
    List<Reserva> findByCapsulaIdWithGuest(@Param("capsuleId") UUID capsuleId);

    /** Reservas activas de un huésped que se solapan con un rango de fechas dado */
    @Query("SELECT r FROM Reserva r " +
           "WHERE LOWER(r.guest.dni) = LOWER(:guestDni) " +
           "AND r.status NOT IN (:excludedStatuses) " +
           "AND r.startDate <= :endDate " +
           "AND r.endDate >= :startDate")
    List<Reserva> findOverlappingActiveByGuestDni(
            @Param("guestDni") String guestDni,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludedStatuses") Collection<Reserva.EstadoReserva> excludedStatuses);
}
