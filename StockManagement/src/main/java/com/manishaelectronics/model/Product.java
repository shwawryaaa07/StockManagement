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

	@Column(name = "low_stock_threshold")
	private Integer lowStockThreshold = 2;

	private String category;
	private String modelNumber;
	private String serialNumbers;

	@Column(name = "active")
	private Boolean active = true;

	// ============================================================
	// CONSTRUCTORS
	// ============================================================

	public Product() {
		this.active = true;
		this.lowStockThreshold = 2;
	}

	public Product(String name, BigDecimal price, Integer quantity, String category) {
		this.name = name;
		this.price = price;
		this.quantity = quantity;
		this.category = category;
		this.lowStockThreshold = 2;
		this.active = true;
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

	public Integer getLowStockThreshold() { return lowStockThreshold != null ? lowStockThreshold : 2; }
	public void setLowStockThreshold(Integer lowStockThreshold) { this.lowStockThreshold = lowStockThreshold != null ? lowStockThreshold : 2; }

	public String getCategory() { return category; }
	public void setCategory(String category) { this.category = category; }

	public String getModelNumber() { return modelNumber; }
	public void setModelNumber(String modelNumber) { this.modelNumber = modelNumber; }

	public String getSerialNumbers() { return serialNumbers; }
	public void setSerialNumbers(String serialNumbers) { this.serialNumbers = serialNumbers; }

	public Boolean getActive() { return active != null ? active : true; }
	public void setActive(Boolean active) { this.active = active; }
}