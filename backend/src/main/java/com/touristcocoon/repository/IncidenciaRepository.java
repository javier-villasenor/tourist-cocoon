package com.touristcocoon.repository;

import com.touristcocoon.domain.Incidencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IncidenciaRepository extends JpaRepository<Incidencia, UUID> {

    @Query("SELECT i FROM Incidencia i JOIN FETCH i.reserva JOIN FETCH i.guest " +
           "WHERE LOWER(i.guest.dni) = LOWER(:dni) ORDER BY i.createdAt DESC")
    List<Incidencia> findByGuestDniWithDetails(@Param("dni") String dni);

    @Query("SELECT i FROM Incidencia i JOIN FETCH i.reserva r JOIN FETCH r.capsula JOIN FETCH i.guest " +
           "ORDER BY i.createdAt DESC")
    List<Incidencia> findAllWithDetails();

    @Query("SELECT i FROM Incidencia i JOIN FETCH i.reserva r JOIN FETCH r.capsula JOIN FETCH i.guest " +
           "WHERE i.id = :id")
    Optional<Incidencia> findByIdWithDetails(@Param("id") UUID id);

    long countByStatusIn(Collection<Incidencia.EstadoIncidencia> statuses);
}
