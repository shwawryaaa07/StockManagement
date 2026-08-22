package com.manishaelectronics.repository;

import com.manishaelectronics.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // ✅ Add this method for duplicate checking
    List<Product> findByNameContainingIgnoreCase(String name);
}