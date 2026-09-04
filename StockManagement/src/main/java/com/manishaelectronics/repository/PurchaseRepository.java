package com.manishaelectronics.repository;

import com.manishaelectronics.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findAllByOrderByCreatedAtDesc();
    List<Purchase> findBySupplierNameContainingIgnoreCase(String supplierName);
}
