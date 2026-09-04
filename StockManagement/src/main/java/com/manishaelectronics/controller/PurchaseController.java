package com.manishaelectronics.controller;

import com.manishaelectronics.model.Product;
import com.manishaelectronics.model.Purchase;
import com.manishaelectronics.model.PurchaseItem;
import com.manishaelectronics.repository.ProductRepository;
import com.manishaelectronics.repository.PurchaseRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/purchases")
@Transactional
public class PurchaseController {

    private final PurchaseRepository purchaseRepository;
    private final ProductRepository productRepository;

    public PurchaseController(PurchaseRepository purchaseRepository, ProductRepository productRepository) {
        this.purchaseRepository = purchaseRepository;
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Purchase> getAllPurchases() {
        return purchaseRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/{id}")
    public Purchase getPurchaseById(@PathVariable Long id) {
        return purchaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase not found with id: " + id));
    }

    @PostMapping
    public Purchase createPurchase(@RequestBody Purchase purchase) {
        purchase.setCreatedAt(LocalDateTime.now());

        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String purchaseNumber = "PUR-" + dateStr + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        purchase.setPurchaseNumber(purchaseNumber);

        if (purchase.getSupplierName() == null || purchase.getSupplierName().trim().isEmpty()) {
            throw new IllegalArgumentException("Supplier name is required.");
        }

        if (purchase.getItems() == null || purchase.getItems().isEmpty()) {
            throw new IllegalArgumentException("Purchase must contain at least one item.");
        }

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (PurchaseItem item : purchase.getItems()) {
            item.setPurchase(purchase);

            if (item.getProduct() != null && item.getProduct().getId() != null) {
                Product product = productRepository.findById(item.getProduct().getId())
                        .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProduct().getId()));

                item.setProduct(product);
                if (item.getProductName() == null || item.getProductName().isBlank()) {
                    item.setProductName(product.getName());
                }
                if (item.getModelNumber() == null || item.getModelNumber().isBlank()) {
                    item.setModelNumber(product.getModelNumber());
                }

                // Increment product stock
                int qty = item.getQuantity() != null ? item.getQuantity() : 0;
                if (qty <= 0) {
                    throw new IllegalArgumentException("Quantity must be greater than zero.");
                }
                product.setQuantity((product.getQuantity() != null ? product.getQuantity() : 0) + qty);
                productRepository.save(product);
            }

            BigDecimal unitPrice = item.getPurchasePrice() != null ? item.getPurchasePrice() : BigDecimal.ZERO;
            item.setPurchasePrice(unitPrice);
            int qty = item.getQuantity() != null ? item.getQuantity() : 0;
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(qty));
            item.setTotalPrice(lineTotal);
            totalAmount = totalAmount.add(lineTotal);
        }

        purchase.setTotalAmount(totalAmount);
        return purchaseRepository.save(purchase);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> deletePurchase(@PathVariable Long id) {
        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase not found with id: " + id));

        // Safely adjust stock back down
        for (PurchaseItem item : purchase.getItems()) {
            if (item.getProduct() != null && item.getProduct().getId() != null) {
                Product product = productRepository.findById(item.getProduct().getId()).orElse(null);
                if (product != null) {
                    int currentQty = product.getQuantity() != null ? product.getQuantity() : 0;
                    int itemQty = item.getQuantity() != null ? item.getQuantity() : 0;
                    product.setQuantity(Math.max(0, currentQty - itemQty));
                    productRepository.save(product);
                }
            }
        }

        purchaseRepository.deleteById(id);
        Map<String, Object> res = new HashMap<>();
        res.put("message", "Purchase deleted with id: " + id + " and stock updated.");
        res.put("success", true);
        return res;
    }
}
