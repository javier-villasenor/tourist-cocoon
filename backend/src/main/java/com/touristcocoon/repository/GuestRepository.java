package com.touristcocoon.repository;

import com.touristcocoon.domain.Huesped;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GuestRepository extends JpaRepository<Huesped, String> {
    List<Huesped> findByDniContainingIgnoreCaseOrLastNameContainingIgnoreCase(String dni, String lastName);
}
