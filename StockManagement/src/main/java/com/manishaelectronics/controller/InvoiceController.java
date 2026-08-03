package com.manishaelectronics.controller;

import com.manishaelectronics.model.Invoice;
import com.manishaelectronics.model.InvoiceItem;
import com.manishaelectronics.model.PaymentStatus;
import com.manishaelectronics.model.Product;
import com.manishaelectronics.repository.InvoiceRepository;
import com.manishaelectronics.repository.InvoiceItemRepository;
import com.manishaelectronics.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private InvoiceItemRepository invoiceItemRepository;

    @Autowired
    private ProductRepository productRepository;

    // ===========================================================
    // 1. GET METHODS (Read data)
    // ===========================================================

    // GET all invoices
    @GetMapping
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    // GET invoice by ID
    @GetMapping("/{id}")
    public Invoice getInvoiceById(@PathVariable Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));
    }

    // GET due invoices (amount_due > 0)
    @GetMapping("/due")
    public List<Invoice> getDueInvoices() {
        return invoiceRepository.findByAmountDueGreaterThan(BigDecimal.ZERO);
    }

    // GET paid invoices (FULLY_PAID)
    @GetMapping("/paid")
    public List<Invoice> getPaidInvoices() {
        return invoiceRepository.findByPaymentStatus(PaymentStatus.FULLY_PAID);
    }

    // GET dashboard summary (NEW)
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

    // GET search invoices by customer name (NEW)
    @GetMapping("/search")
    public List<Invoice> searchInvoices(@RequestParam String customer) {
        return invoiceRepository.findByCustomerNameContainingIgnoreCase(customer);
    }

    // GET invoices by date range (NEW)
    @GetMapping("/report")
    public List<Invoice> getInvoicesByDateRange(
            @RequestParam String from,
            @RequestParam String to) {
        LocalDateTime start = LocalDateTime.parse(from + "T00:00:00");
        LocalDateTime end = LocalDateTime.parse(to + "T23:59:59");
        return invoiceRepository.findByCreatedAtBetween(start, end);
    }

    // GET customer spending total (NEW)
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

    // GET print invoice (for future React use)
    @GetMapping("/{id}/print")
    public String printInvoice(@PathVariable Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        return "Invoice " + invoice.getInvoiceNumber() + " is ready for printing!";
    }

    // ===========================================================
    // 2. POST METHODS (Create data)
    // ===========================================================

    // POST create new invoice
    @PostMapping
    public Invoice createInvoice(@RequestBody Invoice invoice) {

        invoice.setCreatedAt(LocalDateTime.now());

        long count = invoiceRepository.count() + 1;
        String invoiceNumber = String.format("INV-%04d", count);
        invoice.setInvoiceNumber(invoiceNumber);

        BigDecimal subtotal = BigDecimal.ZERO;
        for (InvoiceItem item : invoice.getItems()) {
            item.setInvoice(invoice);
            BigDecimal itemTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            item.setTotalPrice(itemTotal);
            subtotal = subtotal.add(itemTotal);
        }
        invoice.setSubtotal(subtotal);

        BigDecimal gstRate = invoice.getGstRate() != null ? invoice.getGstRate() : new BigDecimal("18");
        BigDecimal gstAmount = subtotal.multiply(gstRate).divide(new BigDecimal("100"));
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
    // 3. PUT METHODS (Update data)
    // ===========================================================

    // PUT record payment (NEW)
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
    // 4. DELETE METHODS (Delete data)
    // ===========================================================

    // DELETE invoice by ID
    @DeleteMapping("/{id}")
    public String deleteInvoice(@PathVariable Long id) {
        invoiceRepository.deleteById(id);
        return "Invoice deleted with id: " + id;
    }

    // DELETE all invoices (For testing - NEW)
    @DeleteMapping("/clear-all")
    public String deleteAllInvoices() {
        invoiceRepository.deleteAll();
        return "All invoices have been deleted!";
    }
}