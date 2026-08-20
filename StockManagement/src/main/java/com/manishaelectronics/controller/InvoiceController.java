package com.manishaelectronics.controller;

import com.manishaelectronics.model.Invoice;
import com.manishaelectronics.model.InvoiceItem;
import com.manishaelectronics.model.PaymentStatus;
import com.manishaelectronics.model.Product;
import com.manishaelectronics.repository.InvoiceRepository;
import com.manishaelectronics.repository.ProductRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
@Transactional
public class InvoiceController {

    // ===========================================================
    // CONSTRUCTOR INJECTION (Clean, testable)
    // ===========================================================
    private final InvoiceRepository invoiceRepository;
    private final ProductRepository productRepository;

    public InvoiceController(InvoiceRepository invoiceRepository, ProductRepository productRepository) {
        this.invoiceRepository = invoiceRepository;
        this.productRepository = productRepository;
    }

    // ===========================================================
    // GET METHODS
    // ===========================================================

    @GetMapping
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    @GetMapping("/{id}")
    public Invoice getInvoiceById(@PathVariable Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));
    }

    @GetMapping("/due")
    public List<Invoice> getDueInvoices() {
        return invoiceRepository.findByAmountDueGreaterThan(BigDecimal.ZERO);
    }

    @GetMapping("/paid")
    public List<Invoice> getPaidInvoices() {
        return invoiceRepository.findByPaymentStatus(PaymentStatus.FULLY_PAID);
    }

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboard() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);

        List<Invoice> todayInvoices = invoiceRepository.findByCreatedAtBetween(startOfDay, endOfDay);

        BigDecimal todaySales = BigDecimal.ZERO;
        for (Invoice inv : todayInvoices) {
            todaySales = todaySales.add(inv.getTotalAmount());
        }

        List<Invoice> dueInvoices = invoiceRepository.findByAmountDueGreaterThan(BigDecimal.ZERO);
        BigDecimal totalDue = BigDecimal.ZERO;
        for (Invoice inv : dueInvoices) {
            totalDue = totalDue.add(inv.getAmountDue());
        }

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("todayInvoices", todayInvoices.size());
        dashboard.put("todaySales", todaySales);
        dashboard.put("totalDueAmount", totalDue);
        dashboard.put("dueInvoicesCount", dueInvoices.size());
        dashboard.put("date", LocalDateTime.now().toLocalDate().toString());

        return dashboard;
    }

    @GetMapping("/search")
    public List<Invoice> searchInvoices(@RequestParam String customer) {
        return invoiceRepository.findByCustomerNameContainingIgnoreCase(customer);
    }

    @GetMapping("/report")
    public List<Invoice> getInvoicesByDateRange(
            @RequestParam String from,
            @RequestParam String to) {
        LocalDateTime start = LocalDateTime.parse(from + "T00:00:00");
        LocalDateTime end = LocalDateTime.parse(to + "T23:59:59");
        return invoiceRepository.findByCreatedAtBetween(start, end);
    }

    @GetMapping("/customer/{customerName}/total")
    public Map<String, Object> getCustomerTotal(@PathVariable String customerName) {
        List<Invoice> invoices = invoiceRepository.findByCustomerNameContainingIgnoreCase(customerName);

        BigDecimal totalSpent = BigDecimal.ZERO;
        for (Invoice inv : invoices) {
            totalSpent = totalSpent.add(inv.getTotalAmount());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("customerName", customerName);
        result.put("totalInvoices", invoices.size());
        result.put("totalSpent", totalSpent);

        return result;
    }

    // ===========================================================
    // POST METHODS
    // ===========================================================

    @PostMapping
    public Invoice createInvoice(@RequestBody Invoice invoice) {

        invoice.setCreatedAt(LocalDateTime.now());

        // ✅ UUID-based invoice number (no duplicates)
        String invoiceNumber = "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        invoice.setInvoiceNumber(invoiceNumber);

        BigDecimal subtotal = BigDecimal.ZERO;
        for (InvoiceItem item : invoice.getItems()) {
            item.setInvoice(invoice);
            BigDecimal itemTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            item.setTotalPrice(itemTotal);
            subtotal = subtotal.add(itemTotal);
        }
        invoice.setSubtotal(subtotal);

        // ✅ GST calculation with proper rounding
        BigDecimal gstRate = invoice.getGstRate() != null ? invoice.getGstRate() : new BigDecimal("18");
        BigDecimal gstAmount = subtotal.multiply(gstRate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        invoice.setGstAmount(gstAmount);

        BigDecimal total = subtotal.add(gstAmount);
        if (invoice.getDiscount() != null) {
            total = total.subtract(invoice.getDiscount());
        }
        invoice.setTotalAmount(total);

        BigDecimal amountPaid = invoice.getAmountPaid();
        if (amountPaid == null || amountPaid.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setPaymentStatus(PaymentStatus.DUE);
            invoice.setAmountDue(total);
        } else if (amountPaid.compareTo(total) >= 0) {
            invoice.setPaymentStatus(PaymentStatus.FULLY_PAID);
            invoice.setAmountDue(BigDecimal.ZERO);
        } else {
            invoice.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
            invoice.setAmountDue(total.subtract(amountPaid));
        }

        // Stock deduction
        for (InvoiceItem item : invoice.getItems()) {
            Product product = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProduct().getId()));

            if (product.getQuantity() < item.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName() +
                        ". Available: " + product.getQuantity() + ", Requested: " + item.getQuantity());
            }

            product.setQuantity(product.getQuantity() - item.getQuantity());
            productRepository.save(product);
        }

        return invoiceRepository.save(invoice);
    }

    // ===========================================================
    // PUT METHODS
    // ===========================================================

    // ✅ NEW: Edit Invoice (Update)
    @PutMapping("/{id}")
    public Invoice updateInvoice(@PathVariable Long id, @RequestBody Invoice updatedInvoice) {
        Invoice existingInvoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));

        // Update basic fields
        existingInvoice.setCustomerName(updatedInvoice.getCustomerName());
        existingInvoice.setCustomerContact(updatedInvoice.getCustomerContact());
        existingInvoice.setDeliveryAddress(updatedInvoice.getDeliveryAddress());
        existingInvoice.setPaymentMode(updatedInvoice.getPaymentMode());
        existingInvoice.setAmountPaid(updatedInvoice.getAmountPaid());
        existingInvoice.setGstRate(updatedInvoice.getGstRate());

        // Recalculate totals
        BigDecimal subtotal = BigDecimal.ZERO;
        for (InvoiceItem item : updatedInvoice.getItems()) {
            subtotal = subtotal.add(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        existingInvoice.setSubtotal(subtotal);

        BigDecimal gstAmount = subtotal.multiply(existingInvoice.getGstRate())
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        existingInvoice.setGstAmount(gstAmount);
        existingInvoice.setTotalAmount(subtotal.add(gstAmount));

        // Update items
        existingInvoice.getItems().clear();
        for (InvoiceItem item : updatedInvoice.getItems()) {
            item.setInvoice(existingInvoice);
            existingInvoice.getItems().add(item);
        }

        // Recalculate payment status
        BigDecimal amountPaid = existingInvoice.getAmountPaid();
        if (amountPaid == null || amountPaid.compareTo(BigDecimal.ZERO) == 0) {
            existingInvoice.setPaymentStatus(PaymentStatus.DUE);
            existingInvoice.setAmountDue(existingInvoice.getTotalAmount());
        } else if (amountPaid.compareTo(existingInvoice.getTotalAmount()) >= 0) {
            existingInvoice.setPaymentStatus(PaymentStatus.FULLY_PAID);
            existingInvoice.setAmountDue(BigDecimal.ZERO);
        } else {
            existingInvoice.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
            existingInvoice.setAmountDue(existingInvoice.getTotalAmount().subtract(amountPaid));
        }

        return invoiceRepository.save(existingInvoice);
    }

    @PutMapping("/{id}/pay")
    public Invoice recordPayment(@PathVariable Long id, @RequestParam BigDecimal amount) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));

        BigDecimal newPaid = invoice.getAmountPaid().add(amount);
        invoice.setAmountPaid(newPaid);

        if (newPaid.compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setPaymentStatus(PaymentStatus.FULLY_PAID);
            invoice.setAmountDue(BigDecimal.ZERO);
        } else {
            invoice.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
            invoice.setAmountDue(invoice.getTotalAmount().subtract(newPaid));
        }

        return invoiceRepository.save(invoice);
    }

    // ===========================================================
    // DELETE METHODS
    // ===========================================================

    @DeleteMapping("/{id}")
    @Transactional  // ← Ensures everything rolls back if something fails
    public String deleteInvoice(@PathVariable Long id) {
        // 1. Find the invoice
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));

        // 2. Restore stock for each item
        for (InvoiceItem item : invoice.getItems()) {
            Product product = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProduct().getId()));

            // Add back the quantity
            product.setQuantity(product.getQuantity() + item.getQuantity());
            productRepository.save(product);
        }

        // 3. Delete the invoice (cascade will delete items too)
        invoiceRepository.deleteById(id);

        return "Invoice deleted with id: " + id + " and stock restored.";
    }
}