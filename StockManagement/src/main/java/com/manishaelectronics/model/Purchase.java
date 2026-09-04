package com.manishaelectronics.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchases")
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String purchaseNumber;

    @Column(nullable = false)
    private String supplierName;

    private String supplierContact;
    private String supplierGstin;
    private String supplierInvoiceNumber;

    private BigDecimal totalAmount;
    private String notes;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseItem> items = new ArrayList<>();

    public Purchase() {}

    public Purchase(String purchaseNumber, String supplierName, String supplierContact,
                    String supplierGstin, String supplierInvoiceNumber, BigDecimal totalAmount, String notes) {
        this.purchaseNumber = purchaseNumber;
        this.supplierName = supplierName;
        this.supplierContact = supplierContact;
        this.supplierGstin = supplierGstin;
        this.supplierInvoiceNumber = supplierInvoiceNumber;
        this.totalAmount = totalAmount;
        this.notes = notes;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPurchaseNumber() { return purchaseNumber; }
    public void setPurchaseNumber(String purchaseNumber) { this.purchaseNumber = purchaseNumber; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public String getSupplierContact() { return supplierContact; }
    public void setSupplierContact(String supplierContact) { this.supplierContact = supplierContact; }

    public String getSupplierGstin() { return supplierGstin; }
    public void setSupplierGstin(String supplierGstin) { this.supplierGstin = supplierGstin; }

    public String getSupplierInvoiceNumber() { return supplierInvoiceNumber; }
    public void setSupplierInvoiceNumber(String supplierInvoiceNumber) { this.supplierInvoiceNumber = supplierInvoiceNumber; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<PurchaseItem> getItems() { return items; }
    public void setItems(List<PurchaseItem> items) { this.items = items; }
}
