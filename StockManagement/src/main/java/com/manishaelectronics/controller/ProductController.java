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
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    // ✅ FIX 3: Extracted method to handle duplicate product logic
    @PostMapping
    public ResponseEntity<?> createProduct(@Valid @RequestBody Product product) {
        List<Product> existingProducts = productRepository.findByNameIgnoreCase(product.getName());

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
        existing.setQuantity(existing.getQuantity() + incoming.getQuantity());

        if (incoming.getPrice() != null && incoming.getPrice().compareTo(existing.getPrice()) != 0) {
            existing.setPrice(incoming.getPrice());
        }

        if (incoming.getCategory() != null && !incoming.getCategory().isEmpty()) {
            existing.setCategory(incoming.getCategory());
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

        return productRepository.save(existingProduct);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            // ✅ FIX 2: Removed unused 'product' variable
            if (!productRepository.existsById(id)) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body("Product not found with id: " + id);
            }

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