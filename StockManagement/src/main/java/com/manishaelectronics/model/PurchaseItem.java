package com.manishaelectronics.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "purchase_items")
public class PurchaseItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "purchase_id", nullable = false)
    @JsonIgnore
    private Purchase purchase;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = true)
    private Product product;

    private String productName;
    private String modelNumber;
    private Integer quantity;
    private BigDecimal purchasePrice;
    private BigDecimal totalPrice;

    public PurchaseItem() {}

    public PurchaseItem(Purchase purchase, Product product, Integer quantity, BigDecimal purchasePrice) {
        this.purchase = purchase;
        this.product = product;
        this.quantity = quantity;
        this.purchasePrice = purchasePrice;
        this.totalPrice = purchasePrice != null && quantity != null
                ? purchasePrice.multiply(BigDecimal.valueOf(quantity))
                : BigDecimal.ZERO;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Purchase getPurchase() { return purchase; }
    public void setPurchase(Purchase purchase) { this.purchase = purchase; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public String getProductName() {
        if (productName != null && !productName.isBlank()) {
            return productName;
        }
        return product != null ? product.getName() : "Product";
    }
    public void setProductName(String productName) { this.productName = productName; }

    public String getModelNumber() { return modelNumber; }
    public void setModelNumber(String modelNumber) { this.modelNumber = modelNumber; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getPurchasePrice() { return purchasePrice; }
    public void setPurchasePrice(BigDecimal purchasePrice) { this.purchasePrice = purchasePrice; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }
}
