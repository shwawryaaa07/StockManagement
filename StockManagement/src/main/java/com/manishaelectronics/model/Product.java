package com.manishaelectronics.model;   // ← IMPORTANT!

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class Product {

 @Id
 @GeneratedValue(strategy = GenerationType.IDENTITY)
 private Long id;

 @Column(nullable = false)
 private String name;

 @Column(nullable = false)
 private BigDecimal price;

 @Column(nullable = false)
 private Integer quantity;

 private String category;

 public Product() {}

 public Product(String name, BigDecimal price, Integer quantity, String category) {
  this.name = name;
  this.price = price;
  this.quantity = quantity;
  this.category = category;
 }

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