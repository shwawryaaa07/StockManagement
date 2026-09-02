package com.manishaelectronics.repository;

import com.manishaelectronics.model.StoreProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoreProfileRepository extends JpaRepository<StoreProfile, Long> {
    Optional<StoreProfile> findFirstByOrderByIdAsc();
}
