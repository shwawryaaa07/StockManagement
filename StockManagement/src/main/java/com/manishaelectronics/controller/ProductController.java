package com.manishaelectronics.controller;

import com.manishaelectronics.model.Product;
import com.manishaelectronics.model.InvoiceItem;
import com.manishaelectronics.repository.ProductRepository;
import com.manishaelectronics.repository.InvoiceItemRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;
    private final InvoiceItemRepository invoiceItemRepository;

    public ProductController(ProductRepository productRepository, InvoiceItemRepository invoiceItemRepository) {
        this.productRepository = productRepository;
        this.invoiceItemRepository = invoiceItemRepository;
    }

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findByActiveTrue();
    }

    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    // ✅ FIX 3: Extracted method to handle duplicate product logic
    @PostMapping
    public ResponseEntity<?> createProduct(@Valid @RequestBody Product product) {
        product.setActive(true);
        List<Product> existingProducts = productRepository.findByNameIgnoreCaseAndActiveTrue(product.getName());

        if (!existingProducts.isEmpty()) {
            // ✅ FIX 1: Using getFirst() instead of get(0)
            Product existingProduct = existingProducts.getFirst();
            Product saved = mergeProduct(existingProduct, product);
            return ResponseEntity.ok(saved);
        } else {
            Product saved = productRepository.save(product);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        }
    }

    // ✅ FIX 3: Extracted method to reduce complexity
    private Product mergeProduct(Product existing, Product incoming) {
        existing.setActive(true);
        existing.setQuantity(existing.getQuantity() + incoming.getQuantity());

        if (incoming.getPrice() != null && incoming.getPrice().compareTo(existing.getPrice()) != 0) {
            existing.setPrice(incoming.getPrice());
        }

        if (incoming.getCategory() != null && !incoming.getCategory().isEmpty()) {
            existing.setCategory(incoming.getCategory());
        }

        if (incoming.getModelNumber() != null && !incoming.getModelNumber().isEmpty()) {
            existing.setModelNumber(incoming.getModelNumber());
        }

        if (incoming.getSerialNumbers() != null && !incoming.getSerialNumbers().isEmpty()) {
            existing.setSerialNumbers(incoming.getSerialNumbers());
        }

        return productRepository.save(existing);
    }

    @PutMapping("/{id}")
    public Product updateProduct(@PathVariable Long id, @Valid @RequestBody Product productDetails) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        existingProduct.setName(productDetails.getName());
        existingProduct.setPrice(productDetails.getPrice());
        existingProduct.setQuantity(productDetails.getQuantity());
        existingProduct.setCategory(productDetails.getCategory());
        existingProduct.setModelNumber(productDetails.getModelNumber());
        existingProduct.setSerialNumbers(productDetails.getSerialNumbers());
        existingProduct.setActive(true);

        return productRepository.save(existingProduct);
    }

    @DeleteMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            Product product = productRepository.findById(id).orElse(null);
            if (product == null) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body("Product not found with id: " + id);
            }

            List<InvoiceItem> items = invoiceItemRepository.findByProductId(id);
            if (items.isEmpty()) {
                productRepository.deleteById(id);
            } else {
                product.setActive(false);
                productRepository.save(product);
            }

            return ResponseEntity.ok("Product deleted successfully");
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting product: " + e.getMessage());
        }
    }
}