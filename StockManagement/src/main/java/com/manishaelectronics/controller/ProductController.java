package com.manishaelectronics.controller;

import com.manishaelectronics.model.Product;
import com.manishaelectronics.model.InvoiceItem;
import com.manishaelectronics.repository.ProductRepository;
import com.manishaelectronics.repository.InvoiceItemRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InvoiceItemRepository invoiceItemRepository;

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    // ✅ FIXED: Handles duplicate product names
    @PostMapping
    public ResponseEntity<?> createProduct(@Valid @RequestBody Product product) {
        // Check if product with same name already exists
        List<Product> existingProducts = productRepository.findByNameContainingIgnoreCase(product.getName());

        if (!existingProducts.isEmpty()) {
            // ✅ FIXED: Use get(0) instead of getFirst() (Java 21 compatible)
            Product existingProduct = existingProducts.get(0);
            existingProduct.setQuantity(existingProduct.getQuantity() + product.getQuantity());

            // If price differs, update it
            if (product.getPrice() != null && product.getPrice().compareTo(existingProduct.getPrice()) != 0) {
                existingProduct.setPrice(product.getPrice());
            }

            // If category differs, update it
            if (product.getCategory() != null && !product.getCategory().isEmpty()) {
                existingProduct.setCategory(product.getCategory());
            }

            Product saved = productRepository.save(existingProduct);
            return ResponseEntity.ok(saved);
        } else {
            // New product — save normally
            Product saved = productRepository.save(product);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        }
    }

    @PutMapping("/{id}")
    public Product updateProduct(@PathVariable Long id, @Valid @RequestBody Product productDetails) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        existingProduct.setName(productDetails.getName());
        existingProduct.setPrice(productDetails.getPrice());
        existingProduct.setQuantity(productDetails.getQuantity());
        existingProduct.setCategory(productDetails.getCategory());

        return productRepository.save(existingProduct);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

            // Check if product is used in any invoice
            List<InvoiceItem> items = invoiceItemRepository.findByProductId(id);
            if (!items.isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.CONFLICT)
                        .body("Cannot delete product because it is used in " + items.size() + " invoice(s).");
            }

            productRepository.deleteById(id);
            return ResponseEntity.ok("Product deleted successfully");
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting product: " + e.getMessage());
        }
    }
}