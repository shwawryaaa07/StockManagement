package com.manishaelectronics.repository;
import java.math.BigDecimal;
import com.manishaelectronics.model.Invoice;
import com.manishaelectronics.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    // Find invoice by invoice number (exact match)
    Invoice findByInvoiceNumber(String invoiceNumber);

    // Find invoices by customer name (case-insensitive, partial match)
    List<Invoice> findByCustomerNameContainingIgnoreCase(String customerName);

    // Find invoices by payment status (FULLY_PAID, PARTIALLY_PAID, DUE)
    List<Invoice> findByPaymentStatus(PaymentStatus paymentStatus);

    // Find invoices created between two dates
    List<Invoice> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    // Find invoices with amount due greater than 0 (for due invoice tracking)
    List<Invoice> findByAmountDueGreaterThan(BigDecimal zero);
}