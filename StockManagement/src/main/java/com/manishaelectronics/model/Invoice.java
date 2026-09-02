package com.manishaelectronics.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String invoiceNumber;

    // Business Info
    private String businessName;
    private String businessAddress;
    private String businessPhone;
    private String businessGstin;

    // Customer Info
    private String customerName;
    private String customerContact;
    private String deliveryAddress;

    // Financial Details
    private BigDecimal subtotal;
    private BigDecimal gstRate;
    private BigDecimal gstAmount;
    private BigDecimal totalAmount;
    private BigDecimal discount;

    // Payment
    @Enumerated(EnumType.STRING)
    private PaymentMode paymentMode;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    private BigDecimal amountPaid;
    private BigDecimal amountDue;

    // Timestamp
    private LocalDateTime createdAt;

    // Relationship: One Invoice has many Items
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvoiceItem> items = new ArrayList<>();

    // Default constructor
    public Invoice() {}

    // Constructor
    public Invoice(String invoiceNumber, String customerName, String customerContact,
                   String deliveryAddress, PaymentMode paymentMode, BigDecimal amountPaid) {
        this.invoiceNumber = invoiceNumber;
        this.customerName = customerName;
        this.customerContact = customerContact;
        this.deliveryAddress = deliveryAddress;
        this.paymentMode = paymentMode;
        this.amountPaid = amountPaid;
        this.createdAt = LocalDateTime.now();
    }

    // ====== GETTERS AND SETTERS ======
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getBusinessAddress() { return businessAddress; }
    public void setBusinessAddress(String businessAddress) { this.businessAddress = businessAddress; }

    public String getBusinessPhone() { return businessPhone; }
    public void setBusinessPhone(String businessPhone) { this.businessPhone = businessPhone; }

    public String getBusinessGstin() { return businessGstin; }
    public void setBusinessGstin(String businessGstin) { this.businessGstin = businessGstin; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerContact() { return customerContact; }
    public void setCustomerContact(String customerContact) { this.customerContact = customerContact; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getGstRate() { return gstRate; }
    public void setGstRate(BigDecimal gstRate) { this.gstRate = gstRate; }

    public BigDecimal getGstAmount() { return gstAmount; }
    public void setGstAmount(BigDecimal gstAmount) { this.gstAmount = gstAmount; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }

    @JsonProperty("discountAmount")
    public BigDecimal getDiscountAmount() { return discount; }
    @JsonProperty("discountAmount")
    public void setDiscountAmount(BigDecimal discountAmount) {
        if (discountAmount != null) {
            this.discount = discountAmount;
        }
    }

    public PaymentMode getPaymentMode() { return paymentMode; }
    public void setPaymentMode(PaymentMode paymentMode) { this.paymentMode = paymentMode; }

    @JsonProperty("paymentMethod")
    public String getPaymentMethod() {
        return this.paymentMode != null ? this.paymentMode.name() : "CASH";
    }

    @JsonProperty("paymentMethod")
    public void setPaymentMethod(String paymentMethod) {
        if (paymentMethod != null && !paymentMethod.isBlank()) {
            try {
                this.paymentMode = PaymentMode.valueOf(paymentMethod.trim().toUpperCase());
            } catch (Exception ignored) {
                this.paymentMode = PaymentMode.CASH;
            }
        }
    }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public BigDecimal getAmountPaid() { return amountPaid; }
    public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }

    public BigDecimal getAmountDue() { return amountDue; }
    public void setAmountDue(BigDecimal amountDue) { this.amountDue = amountDue; }

    @JsonProperty("balanceDue")
    public BigDecimal getBalanceDue() { return amountDue; }
    @JsonProperty("balanceDue")
    public void setBalanceDue(BigDecimal balanceDue) {
        if (balanceDue != null) {
            this.amountDue = balanceDue;
        }
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<InvoiceItem> getItems() { return items; }
    public void setItems(List<InvoiceItem> items) { this.items = items; }

    // ====== SMART METHOD: Status Display with Emoji ======
    public String getStatusDisplay() {
        if (this.paymentStatus == null) {
            return "⚠️ UNKNOWN";
        }
        switch (this.paymentStatus) {
            case FULLY_PAID:
                return "✅ FULLY PAID";
            case PARTIALLY_PAID:
                return "🟡 PARTIALLY PAID";
            case DUE:
                return "🟡 DUE";
            default:
                return "⚠️ UNKNOWN";
        }
    }
}