package com.manishaelectronics.controller;

import com.manishaelectronics.config.ShopConfig;  // ✅ NEW IMPORT
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

    private final InvoiceRepository invoiceRepository;
    private final ProductRepository productRepository;
    private final ShopConfig shopConfig;  // ✅ NEW

    // ✅ Constructor Injection
    public InvoiceController(InvoiceRepository invoiceRepository,
                             ProductRepository productRepository,
                             ShopConfig shopConfig) {
        this.invoiceRepository = invoiceRepository;
        this.productRepository = productRepository;
        this.shopConfig = shopConfig;
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
        try {
            String fromClean = from.trim().split("T")[0];
            String toClean = to.trim().split("T")[0];
            LocalDateTime start = LocalDateTime.parse(fromClean + "T00:00:00");
            LocalDateTime end = LocalDateTime.parse(toClean + "T23:59:59");
            return invoiceRepository.findByCreatedAtBetween(start, end);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date format. Please use YYYY-MM-DD.");
        }
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

        // Business info from server config
        invoice.setBusinessName(shopConfig.getName());
        invoice.setBusinessAddress(shopConfig.getAddress());
        invoice.setBusinessPhone(shopConfig.getPhone());
        invoice.setBusinessGstin(shopConfig.getGstin());

        // Generate invoice number (UUID-based, no duplicates)
        String invoiceNumber = "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        invoice.setInvoiceNumber(invoiceNumber);

        if (invoice.getItems() == null || invoice.getItems().isEmpty()) {
            throw new IllegalArgumentException("Invoice must contain at least one item.");
        }

        // Aggregate requested quantities per product to prevent negative stock
        Map<Long, Integer> productQuantities = new HashMap<>();
        for (InvoiceItem item : invoice.getItems()) {
            if (item.getProduct() == null || item.getProduct().getId() == null) {
                throw new IllegalArgumentException("Product and Product ID must be provided for every item.");
            }
            int qty = item.getQuantity() != null ? item.getQuantity() : 0;
            if (qty <= 0) {
                throw new IllegalArgumentException("Quantity must be greater than zero.");
            }
            productQuantities.put(item.getProduct().getId(),
                    productQuantities.getOrDefault(item.getProduct().getId(), 0) + qty);
        }

        // Validate available stock against aggregated demand
        for (Map.Entry<Long, Integer> entry : productQuantities.entrySet()) {
            Long prodId = entry.getKey();
            Integer requestedQty = entry.getValue();
            Product product = productRepository.findById(prodId)
                    .orElseThrow(() -> new RuntimeException("Product not found: " + prodId));

            if (product.getQuantity() < requestedQty) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName() +
                        ". Available: " + product.getQuantity() + ", Requested: " + requestedQty);
            }
        }

        // Compute totals & link items
        BigDecimal subtotal = BigDecimal.ZERO;
        for (InvoiceItem item : invoice.getItems()) {
            item.setInvoice(invoice);
            Product prod = productRepository.findById(item.getProduct().getId()).orElseThrow();
            BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : prod.getPrice();
            item.setUnitPrice(unitPrice);
            BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            item.setTotalPrice(itemTotal);
            if (item.getDiscount() == null) {
                item.setDiscount(BigDecimal.ZERO);
            }
            item.setProductName(prod.getName());
            if (item.getModelNumber() == null || item.getModelNumber().isBlank()) {
                item.setModelNumber(prod.getModelNumber());
            }
            subtotal = subtotal.add(itemTotal);
        }
        invoice.setSubtotal(subtotal);

        // GST calculation with proper rounding
        BigDecimal gstRate = invoice.getGstRate() != null ? invoice.getGstRate() : new BigDecimal("18");
        invoice.setGstRate(gstRate);
        BigDecimal gstAmount = subtotal.multiply(gstRate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        invoice.setGstAmount(gstAmount);

        BigDecimal total = subtotal.add(gstAmount);
        if (invoice.getDiscount() != null && invoice.getDiscount().compareTo(BigDecimal.ZERO) > 0) {
            total = total.subtract(invoice.getDiscount());
        }
        invoice.setTotalAmount(total);

        // Payment status
        BigDecimal amountPaid = invoice.getAmountPaid() != null ? invoice.getAmountPaid() : BigDecimal.ZERO;
        invoice.setAmountPaid(amountPaid);
        if (amountPaid.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setPaymentStatus(PaymentStatus.DUE);
            invoice.setAmountDue(total);
        } else if (amountPaid.compareTo(total) >= 0) {
            invoice.setPaymentStatus(PaymentStatus.FULLY_PAID);
            invoice.setAmountDue(BigDecimal.ZERO);
        } else {
            invoice.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
            invoice.setAmountDue(total.subtract(amountPaid));
        }

        // Deduct aggregated stock
        for (Map.Entry<Long, Integer> entry : productQuantities.entrySet()) {
            Product product = productRepository.findById(entry.getKey()).orElseThrow();
            product.setQuantity(product.getQuantity() - entry.getValue());
            productRepository.save(product);
        }

        return invoiceRepository.save(invoice);
    }

    // ===========================================================
    // PUT METHODS
    // ===========================================================

    @PutMapping("/{id}")
    @Transactional
    public Invoice updateInvoice(@PathVariable Long id, @RequestBody Invoice updatedInvoice) {
        Invoice existingInvoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));

        if (updatedInvoice.getItems() == null || updatedInvoice.getItems().isEmpty()) {
            throw new IllegalArgumentException("Invoice must contain at least one item.");
        }

        // 1. Restore stock from old items
        Map<Long, Integer> oldProductQuantities = new HashMap<>();
        for (InvoiceItem oldItem : existingInvoice.getItems()) {
            if (oldItem.getProduct() != null && oldItem.getProduct().getId() != null) {
                oldProductQuantities.put(oldItem.getProduct().getId(),
                        oldProductQuantities.getOrDefault(oldItem.getProduct().getId(), 0) + oldItem.getQuantity());
            }
        }
        for (Map.Entry<Long, Integer> entry : oldProductQuantities.entrySet()) {
            Product product = productRepository.findById(entry.getKey())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + entry.getKey()));
            product.setQuantity(product.getQuantity() + entry.getValue());
            productRepository.save(product);
        }

        // 2. Aggregate demand for new items
        Map<Long, Integer> newProductQuantities = new HashMap<>();
        for (InvoiceItem newItem : updatedInvoice.getItems()) {
            if (newItem.getProduct() == null || newItem.getProduct().getId() == null) {
                throw new IllegalArgumentException("Product and Product ID must be provided for every item.");
            }
            int qty = newItem.getQuantity() != null ? newItem.getQuantity() : 0;
            if (qty <= 0) {
                throw new IllegalArgumentException("Quantity must be greater than zero.");
            }
            newProductQuantities.put(newItem.getProduct().getId(),
                    newProductQuantities.getOrDefault(newItem.getProduct().getId(), 0) + qty);
        }

        // 3. Validate stock against newly restored balances
        for (Map.Entry<Long, Integer> entry : newProductQuantities.entrySet()) {
            Long prodId = entry.getKey();
            Integer requestedQty = entry.getValue();
            Product product = productRepository.findById(prodId)
                    .orElseThrow(() -> new RuntimeException("Product not found: " + prodId));

            if (product.getQuantity() < requestedQty) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName() +
                        ". Available: " + product.getQuantity() + ", Requested: " + requestedQty);
            }
        }

        // 4. Deduct new stock demand
        for (Map.Entry<Long, Integer> entry : newProductQuantities.entrySet()) {
            Product product = productRepository.findById(entry.getKey()).orElseThrow();
            product.setQuantity(product.getQuantity() - entry.getValue());
            productRepository.save(product);
        }

        // 5. Update invoice fields
        existingInvoice.setCustomerName(updatedInvoice.getCustomerName());
        existingInvoice.setCustomerContact(updatedInvoice.getCustomerContact());
        existingInvoice.setDeliveryAddress(updatedInvoice.getDeliveryAddress());
        existingInvoice.setPaymentMode(updatedInvoice.getPaymentMode());

        BigDecimal amountPaid = updatedInvoice.getAmountPaid() != null ? updatedInvoice.getAmountPaid() : BigDecimal.ZERO;
        existingInvoice.setAmountPaid(amountPaid);

        BigDecimal gstRate = updatedInvoice.getGstRate() != null ? updatedInvoice.getGstRate() :
                (existingInvoice.getGstRate() != null ? existingInvoice.getGstRate() : new BigDecimal("18"));
        existingInvoice.setGstRate(gstRate);

        BigDecimal discount = updatedInvoice.getDiscount() != null ? updatedInvoice.getDiscount() :
                (existingInvoice.getDiscount() != null ? existingInvoice.getDiscount() : BigDecimal.ZERO);
        existingInvoice.setDiscount(discount);

        // 6. Replace and compute items
        BigDecimal subtotal = BigDecimal.ZERO;
        existingInvoice.getItems().clear();
        for (InvoiceItem item : updatedInvoice.getItems()) {
            InvoiceItem newItem = new InvoiceItem();
            newItem.setInvoice(existingInvoice);
            Product prod = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProduct().getId()));
            newItem.setProduct(prod);
            newItem.setQuantity(item.getQuantity());
            BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : prod.getPrice();
            newItem.setUnitPrice(unitPrice);
            BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            newItem.setTotalPrice(itemTotal);
            newItem.setDiscount(item.getDiscount() != null ? item.getDiscount() : BigDecimal.ZERO);
            newItem.setProductName(prod.getName());
            newItem.setModelNumber(item.getModelNumber() != null && !item.getModelNumber().isBlank() ? item.getModelNumber() : prod.getModelNumber());
            newItem.setSerialNumber(item.getSerialNumber());
            existingInvoice.getItems().add(newItem);

            subtotal = subtotal.add(itemTotal);
        }
        existingInvoice.setSubtotal(subtotal);

        BigDecimal gstAmount = subtotal.multiply(gstRate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        existingInvoice.setGstAmount(gstAmount);

        BigDecimal total = subtotal.add(gstAmount);
        if (discount.compareTo(BigDecimal.ZERO) > 0) {
            total = total.subtract(discount);
        }
        existingInvoice.setTotalAmount(total);

        // 7. Recalculate payment status
        if (amountPaid.compareTo(BigDecimal.ZERO) == 0) {
            existingInvoice.setPaymentStatus(PaymentStatus.DUE);
            existingInvoice.setAmountDue(total);
        } else if (amountPaid.compareTo(total) >= 0) {
            existingInvoice.setPaymentStatus(PaymentStatus.FULLY_PAID);
            existingInvoice.setAmountDue(BigDecimal.ZERO);
        } else {
            existingInvoice.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
            existingInvoice.setAmountDue(total.subtract(amountPaid));
        }

        return invoiceRepository.save(existingInvoice);
    }

    @PutMapping("/{id}/pay")
    public Invoice recordPayment(@PathVariable Long id, @RequestParam BigDecimal amount) {
        // ✅ FIX: Validate payment amount
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }

        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));

        if (amount.compareTo(invoice.getAmountDue()) > 0) {
            throw new IllegalArgumentException("Payment cannot exceed due amount: ₹" + invoice.getAmountDue());
        }

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
    @Transactional
    public String deleteInvoice(@PathVariable Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));

        // Restore stock before deleting
        for (InvoiceItem item : invoice.getItems()) {
            Product product = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProduct().getId()));
            product.setQuantity(product.getQuantity() + item.getQuantity());
            productRepository.save(product);
        }

        invoiceRepository.deleteById(id);
        return "Invoice deleted with id: " + id + " and stock restored.";
    }
}