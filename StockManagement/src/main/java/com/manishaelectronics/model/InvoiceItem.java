package com.manishaelectronics.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "invoice_items")
public class InvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "invoice_id", nullable = false)
    @JsonIgnore
    private Invoice invoice;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = true)
    private Product product;

    private String productName;

    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal discount;
    private BigDecimal totalPrice;
    private String modelNumber;
    private String serialNumber;

    @Column
    private Integer warrantyMonths; // e.g. 12, 24, 36

    @Column
    private String warrantyType; // e.g. "Manufacturer", "Extended", "Store"

    @Column
    private String warrantyNotes; // e.g. "Samsung India warranty card included"

    // Default constructor
    public InvoiceItem() {}

    // Constructor
    public InvoiceItem(Invoice invoice, Product product, Integer quantity, BigDecimal unitPrice) {
        this.invoice = invoice;
        this.product = product;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.discount = BigDecimal.ZERO;
        this.totalPrice = unitPrice != null && quantity != null ? unitPrice.multiply(BigDecimal.valueOf(quantity)) : BigDecimal.ZERO;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Invoice getInvoice() { return invoice; }
    public void setInvoice(Invoice invoice) { this.invoice = invoice; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public String getModelNumber() { return modelNumber; }
    public void setModelNumber(String modelNumber) { this.modelNumber = modelNumber; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public Integer getWarrantyMonths() { return warrantyMonths; }
    public void setWarrantyMonths(Integer warrantyMonths) { this.warrantyMonths = warrantyMonths; }

    public String getWarrantyType() { return warrantyType; }
    public void setWarrantyType(String warrantyType) { this.warrantyType = warrantyType; }

    public String getWarrantyNotes() { return warrantyNotes; }
    public void setWarrantyNotes(String warrantyNotes) { this.warrantyNotes = warrantyNotes; }

    public String getProductName() {
        if (productName != null && !productName.isBlank()) {
            return productName;
        }
        return product != null ? product.getName() : "Product";
    }
    public void setProductName(String productName) { this.productName = productName; }
}