package com.manishaelectronics.controller;

import com.manishaelectronics.config.ShopConfig;
import com.manishaelectronics.model.*;
import com.manishaelectronics.repository.InvoiceRepository;
import com.manishaelectronics.repository.ProductRepository;
import com.manishaelectronics.repository.StoreProfileRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
    private final ShopConfig shopConfig;
    private final StoreProfileRepository storeProfileRepository;

    public InvoiceController(
            InvoiceRepository invoiceRepository,
            ProductRepository productRepository,
            ShopConfig shopConfig,
            StoreProfileRepository storeProfileRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.productRepository = productRepository;
        this.shopConfig = shopConfig;
        this.storeProfileRepository = storeProfileRepository;
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

        List<Product> products = productRepository.findByActiveTrue();
        long lowStockCount = products.stream().filter(p -> (p.getQuantity() != null ? p.getQuantity() : 0) <= (p.getLowStockThreshold() != null ? p.getLowStockThreshold() : 2)).count();
        long totalInvoices = invoiceRepository.count();

        // 6-month sales trend for dashboard analytics
        List<Map<String, Object>> monthlySales = new java.util.ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthStart = LocalDateTime.now().minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);
            List<Invoice> monthInvoices = invoiceRepository.findByCreatedAtBetween(monthStart, monthEnd);
            BigDecimal monthTotal = BigDecimal.ZERO;
            for (Invoice inv : monthInvoices) {
                if (inv.getTotalAmount() != null) {
                    monthTotal = monthTotal.add(inv.getTotalAmount());
                }
            }
            String monthLabel = monthStart.format(DateTimeFormatter.ofPattern("MMM yyyy"));
            Map<String, Object> m = new HashMap<>();
            m.put("month", monthLabel);
            m.put("sales", monthTotal);
            m.put("invoices", monthInvoices.size());
            monthlySales.add(m);
        }

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("todayInvoices", todayInvoices.size());
        dashboard.put("todaySales", todaySales);
        dashboard.put("totalSales", todaySales);
        dashboard.put("totalDueAmount", totalDue);
        dashboard.put("totalDue", totalDue);
        dashboard.put("dueInvoicesCount", dueInvoices.size());
        dashboard.put("totalInvoices", totalInvoices);
        dashboard.put("lowStockCount", lowStockCount);
        dashboard.put("monthlySales", monthlySales);
        dashboard.put("date", LocalDateTime.now().toLocalDate().toString());

        return dashboard;
    }

    @GetMapping("/warranty-expiring")
    public List<Map<String, Object>> getExpiringWarranties(@RequestParam(defaultValue = "30") int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime future = now.plusDays(days);
        List<Invoice> allInvoices = invoiceRepository.findAll();
        List<Map<String, Object>> expiringList = new java.util.ArrayList<>();
        for (Invoice inv : allInvoices) {
            if (inv.getItems() == null) continue;
            for (InvoiceItem item : inv.getItems()) {
                if (item.getWarrantyMonths() != null && item.getWarrantyMonths() > 0) {
                    LocalDateTime invoiceDate = inv.getCreatedAt() != null ? inv.getCreatedAt() : LocalDateTime.now();
                    LocalDateTime expiryDate = invoiceDate.plusMonths(item.getWarrantyMonths());
                    if (expiryDate.isAfter(now.minusDays(7)) && expiryDate.isBefore(future)) {
                        Map<String, Object> map = new HashMap<>();
                        map.put("invoiceId", inv.getId());
                        map.put("invoiceNumber", inv.getInvoiceNumber());
                        map.put("customerName", inv.getCustomerName());
                        map.put("customerContact", inv.getCustomerContact());
                        map.put("productName", item.getProductName());
                        map.put("modelNumber", item.getModelNumber());
                        map.put("serialNumber", item.getSerialNumber());
                        map.put("warrantyMonths", item.getWarrantyMonths());
                        map.put("warrantyType", item.getWarrantyType());
                        map.put("warrantyNotes", item.getWarrantyNotes());
                        map.put("purchaseDate", invoiceDate.toLocalDate().toString());
                        map.put("expiryDate", expiryDate.toLocalDate().toString());
                        long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(now.toLocalDate(), expiryDate.toLocalDate());
                        map.put("daysRemaining", daysRemaining);
                        expiringList.add(map);
                    }
                }
            }
        }
        expiringList.sort((a, b) -> Long.compare((Long) a.get("daysRemaining"), (Long) b.get("daysRemaining")));
        return expiringList;
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

        // Business info from persistent DB profile or server config
        StoreProfile profile = storeProfileRepository.findFirstByOrderByIdAsc().orElse(null);
        if (profile != null) {
            invoice.setBusinessName(profile.getShopName());
            invoice.setBusinessAddress(profile.getAddress());
            invoice.setBusinessPhone(profile.getPhone());
            invoice.setBusinessGstin(profile.getGstin());
        } else {
            invoice.setBusinessName(shopConfig.getName());
            invoice.setBusinessAddress(shopConfig.getAddress());
            invoice.setBusinessPhone(shopConfig.getPhone());
            invoice.setBusinessGstin(shopConfig.getGstin());
        }

        // Generate collision-proof invoice number with date prefix
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String invoiceNumber = "INV-" + dateStr + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
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

        // Validate available stock against aggregated demand and cache product entities
        Map<Long, Product> productCache = new HashMap<>();
        for (Map.Entry<Long, Integer> entry : productQuantities.entrySet()) {
            Long prodId = entry.getKey();
            Integer requestedQty = entry.getValue();
            Product product = productRepository.findById(prodId)
                    .orElseThrow(() -> new RuntimeException("Product not found: " + prodId));
            productCache.put(prodId, product);

            if (product.getQuantity() < requestedQty) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName() +
                        ". Available: " + product.getQuantity() + ", Requested: " + requestedQty);
            }
        }

        // Compute totals & link items
        BigDecimal subtotal = BigDecimal.ZERO;
        for (InvoiceItem item : invoice.getItems()) {
            item.setInvoice(invoice);
            Product prod = productCache.get(item.getProduct().getId());
            if (prod == null) {
                prod = productRepository.findById(item.getProduct().getId()).orElseThrow();
                productCache.put(prod.getId(), prod);
            }
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

        // GST calculation on taxable amount (subtotal - discount)
        BigDecimal discount = invoice.getDiscount() != null ? invoice.getDiscount() : BigDecimal.ZERO;
        invoice.setDiscount(discount);

        BigDecimal taxableAmount = subtotal.subtract(discount);
        if (taxableAmount.compareTo(BigDecimal.ZERO) < 0) {
            taxableAmount = BigDecimal.ZERO;
        }

        BigDecimal gstRate = invoice.getGstRate() != null ? invoice.getGstRate() : new BigDecimal("18");
        invoice.setGstRate(gstRate);
        BigDecimal gstAmount = taxableAmount.multiply(gstRate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        invoice.setGstAmount(gstAmount);

        BigDecimal total = taxableAmount.add(gstAmount);
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

        // Deduct aggregated stock using cached products
        for (Map.Entry<Long, Integer> entry : productQuantities.entrySet()) {
            Product product = productCache.get(entry.getKey());
            if (product == null) {
                product = productRepository.findById(entry.getKey()).orElseThrow();
            }
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

        // 3. Validate stock against newly restored balances and cache product entities
        Map<Long, Product> productCache = new HashMap<>();
        for (Map.Entry<Long, Integer> entry : newProductQuantities.entrySet()) {
            Long prodId = entry.getKey();
            Integer requestedQty = entry.getValue();
            Product product = productRepository.findById(prodId)
                    .orElseThrow(() -> new RuntimeException("Product not found: " + prodId));
            productCache.put(prodId, product);

            if (product.getQuantity() < requestedQty) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName() +
                        ". Available: " + product.getQuantity() + ", Requested: " + requestedQty);
            }
        }

        // 4. Deduct new stock demand
        for (Map.Entry<Long, Integer> entry : newProductQuantities.entrySet()) {
            Product product = productCache.get(entry.getKey());
            if (product == null) {
                product = productRepository.findById(entry.getKey()).orElseThrow();
            }
            product.setQuantity(product.getQuantity() - entry.getValue());
            productRepository.save(product);
        }

        // 5. Update invoice fields
        existingInvoice.setCustomerName(updatedInvoice.getCustomerName());
        existingInvoice.setCustomerContact(updatedInvoice.getCustomerContact());
        existingInvoice.setDeliveryAddress(updatedInvoice.getDeliveryAddress());
        if (updatedInvoice.getPaymentMode() != null) {
            existingInvoice.setPaymentMode(updatedInvoice.getPaymentMode());
        }

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
            Product prod = productCache.get(item.getProduct().getId());
            if (prod == null) {
                prod = productRepository.findById(item.getProduct().getId())
                        .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProduct().getId()));
                productCache.put(prod.getId(), prod);
            }
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
            newItem.setWarrantyMonths(item.getWarrantyMonths());
            newItem.setWarrantyType(item.getWarrantyType());
            newItem.setWarrantyNotes(item.getWarrantyNotes());
            existingInvoice.getItems().add(newItem);

            subtotal = subtotal.add(itemTotal);
        }
        existingInvoice.setSubtotal(subtotal);

        BigDecimal taxableAmount = subtotal.subtract(discount);
        if (taxableAmount.compareTo(BigDecimal.ZERO) < 0) {
            taxableAmount = BigDecimal.ZERO;
        }

        BigDecimal gstAmount = taxableAmount.multiply(gstRate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        existingInvoice.setGstAmount(gstAmount);

        BigDecimal total = taxableAmount.add(gstAmount);
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

    @PutMapping(value = {"/{id}/pay", "/{id}/settle"})
    public Invoice recordPayment(
            @PathVariable Long id,
            @RequestParam(required = false) BigDecimal amount,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        BigDecimal paymentAmount = amount;
        PaymentMode paymentMode = null;

        if (body != null) {
            if (body.get("amount") != null) {
                paymentAmount = new BigDecimal(body.get("amount").toString());
            } else if (body.get("amountPaid") != null) {
                paymentAmount = new BigDecimal(body.get("amountPaid").toString());
            }
            if (body.get("paymentMethod") != null) {
                try {
                    paymentMode = PaymentMode.valueOf(body.get("paymentMethod").toString().trim().toUpperCase());
                } catch (Exception ignored) {}
            } else if (body.get("paymentMode") != null) {
                try {
                    paymentMode = PaymentMode.valueOf(body.get("paymentMode").toString().trim().toUpperCase());
                } catch (Exception ignored) {}
            }
        }

        if (paymentAmount == null || paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }

        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));

        if (paymentAmount.compareTo(invoice.getAmountDue()) > 0) {
            throw new IllegalArgumentException("Payment cannot exceed due amount: ₹" + invoice.getAmountDue());
        }

        BigDecimal currentPaid = invoice.getAmountPaid() != null ? invoice.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal newPaid = currentPaid.add(paymentAmount);
        invoice.setAmountPaid(newPaid);

        if (paymentMode != null) {
            invoice.setPaymentMode(paymentMode);
        }

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

        // Restore stock safely before deleting
        for (InvoiceItem item : invoice.getItems()) {
            if (item.getProduct() != null && item.getProduct().getId() != null) {
                Product product = productRepository.findById(item.getProduct().getId()).orElse(null);
                if (product != null) {
                    product.setQuantity(product.getQuantity() + item.getQuantity());
                    productRepository.save(product);
                }
            }
        }

        invoiceRepository.deleteById(id);
        return "Invoice deleted with id: " + id + " and stock restored.";
    }
}