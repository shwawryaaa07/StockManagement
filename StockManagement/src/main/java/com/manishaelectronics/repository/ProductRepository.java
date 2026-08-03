package com.manishaelectronics.repository;   // ← IMPORTANT!

import com.manishaelectronics.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
}