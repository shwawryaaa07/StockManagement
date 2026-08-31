package com.manishaelectronics.repository;

import com.manishaelectronics.model.StaffAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaffAccountRepository extends JpaRepository<StaffAccount, Long> {
    Optional<StaffAccount> findByUsernameIgnoreCase(String username);
    Optional<StaffAccount> findByStaffCode(String staffCode);
}
