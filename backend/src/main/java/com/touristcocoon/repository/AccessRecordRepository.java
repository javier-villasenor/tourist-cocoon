package com.touristcocoon.repository;

import com.touristcocoon.domain.RegistroAcceso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AccessRecordRepository extends JpaRepository<RegistroAcceso, UUID> {
    List<RegistroAcceso> findByGuestDniOrderByTimestampDesc(String guestDni);
    List<RegistroAcceso> findByCapsuleIdOrderByTimestampDesc(UUID capsuleId);
}
