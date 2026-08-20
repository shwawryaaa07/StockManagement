package com.manishaelectronics.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class Product {

 @Id
 @GeneratedValue(strategy = GenerationType.IDENTITY)
 private Long id;

 @NotBlank(message = "Product name is required")
 @Column(nullable = false)
 private String name;

 @NotNull(message = "Price is required")
 @Positive(message = "Price must be greater than 0")
 @Column(nullable = false)
 private BigDecimal price;

 @NotNull(message = "Quantity is required")
 @Min(value = 0, message = "Quantity cannot be negative")
 @Column(nullable = false)
 private Integer quantity;

 private String category;

 // ============================================================
 // CONSTRUCTORS
 // ============================================================

 public Product() {}

 public Product(String name, BigDecimal price, Integer quantity, String category) {
  this.name = name;
  this.price = price;
  this.quantity = quantity;
  this.category = category;
 }

 // ============================================================
 // GETTERS & SETTERS
 // ============================================================

 public Long getId() { return id; }
 public void setId(Long id) { this.id = id; }

 public String getName() { return name; }
 public void setName(String name) { this.name = name; }

 public BigDecimal getPrice() { return price; }
 public void setPrice(BigDecimal price) { this.price = price; }

 public Integer getQuantity() { return quantity; }
 public void setQuantity(Integer quantity) { this.quantity = quantity; }

 public String getCategory() { return category; }
 public void setCategory(String category) { this.category = category; }
}