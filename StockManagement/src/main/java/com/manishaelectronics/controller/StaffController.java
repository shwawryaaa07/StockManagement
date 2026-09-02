package com.manishaelectronics.controller;

import com.manishaelectronics.model.StaffAccount;
import com.manishaelectronics.model.StoreProfile;
import com.manishaelectronics.repository.StaffAccountRepository;
import com.manishaelectronics.repository.StoreProfileRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    private final StaffAccountRepository staffAccountRepository;
    private final StoreProfileRepository storeProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public StaffController(
            StaffAccountRepository staffAccountRepository,
            StoreProfileRepository storeProfileRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.staffAccountRepository = staffAccountRepository;
        this.storeProfileRepository = storeProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // GET /api/staff - List all staff accounts from MySQL
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<List<StaffAccount>> getStaffList() {
        List<StaffAccount> list = staffAccountRepository.findAll();
        // If first time initialization, seed with Tejas (BCrypt PIN)
        if (list.isEmpty()) {
            StaffAccount initial = new StaffAccount(
                    "STF-01",
                    "Tejas",
                    "tejas11",
                    passwordEncoder.encode("0987"),
                    "Inventory Specialist",
                    "Active",
                    LocalDate.now().toString()
            );
            staffAccountRepository.save(initial);
            list = List.of(initial);
        }
        return ResponseEntity.ok(list);
    }

    // POST /api/staff - Save or update staff in MySQL
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> addOrUpdateStaff(@RequestBody Map<String, Object> request) {
        String username = (String) request.get("username");
        String name = (String) request.get("name");
        String pin = (String) request.get("pin");
        String role = (String) request.get("role");
        String status = (String) request.get("status");

        if (username == null || username.isBlank() || name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name and username are required"));
        }

        Optional<StaffAccount> existingOpt = staffAccountRepository.findByUsernameIgnoreCase(username.trim());
        StaffAccount staff;
        if (existingOpt.isPresent()) {
            staff = existingOpt.get();
            staff.setName(name.trim());
            if (pin != null && !pin.isBlank()) {
                staff.setPin(passwordEncoder.encode(pin.trim()));
            }
            if (role != null) staff.setRole(role.trim());
            if (status != null) staff.setStatus(status.trim());
        } else {
            if (pin == null || pin.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "PIN is required for new staff accounts"));
            }
            String code = (String) request.get("id");
            if (code == null || code.isBlank()) {
                code = "STF-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            }
            staff = new StaffAccount(
                    code,
                    name.trim(),
                    username.trim(),
                    passwordEncoder.encode(pin.trim()),
                    role != null ? role.trim() : "Cashier",
                    status != null ? status.trim() : "Active",
                    LocalDate.now().toString()
            );
        }

        StaffAccount saved = staffAccountRepository.save(staff);
        return ResponseEntity.ok(saved);
    }

    // DELETE /api/staff/{id} - Delete from MySQL database
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> deleteStaff(@PathVariable String id) {
        try {
            Long numId = Long.parseLong(id);
            staffAccountRepository.deleteById(numId);
        } catch (NumberFormatException e) {
            Optional<StaffAccount> byCode = staffAccountRepository.findByStaffCode(id);
            if (byCode.isPresent()) {
                staffAccountRepository.delete(byCode.get());
            } else {
                Optional<StaffAccount> byUser = staffAccountRepository.findByUsernameIgnoreCase(id);
                byUser.ifPresent(staffAccountRepository::delete);
            }
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Staff account deleted from database"
        ));
    }

    // GET /api/staff/store-profile - Get persistent store profile
    @GetMapping("/store-profile")
    public ResponseEntity<StoreProfile> getStoreProfile() {
        StoreProfile profile = storeProfileRepository.findFirstByOrderByIdAsc().orElseGet(() -> {
            StoreProfile initial = new StoreProfile(
                    "MANISHA ELECTRONICS",
                    "Ramesh Naik (Owner)",
                    "30AMYPN1753F1ZY",
                    "9309736172, 70205592347",
                    "EDEN GROVE Building, Nr. State Bank of India, Valpoi, Goa"
            );
            return storeProfileRepository.save(initial);
        });
        return ResponseEntity.ok(profile);
    }

    // POST /api/staff/store-profile - Update store profile in database
    @PostMapping("/store-profile")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> updateStoreProfile(@RequestBody Map<String, String> updated) {
        StoreProfile profile = storeProfileRepository.findFirstByOrderByIdAsc().orElseGet(() -> new StoreProfile(
                "MANISHA ELECTRONICS",
                "Ramesh Naik (Owner)",
                "30AMYPN1753F1ZY",
                "9309736172, 70205592347",
                "EDEN GROVE Building, Nr. State Bank of India, Valpoi, Goa"
        ));

        if (updated.get("shopName") != null) profile.setShopName(updated.get("shopName").trim());
        if (updated.get("ownerName") != null) profile.setOwnerName(updated.get("ownerName").trim());
        if (updated.get("gstin") != null) profile.setGstin(updated.get("gstin").trim());
        if (updated.get("phone") != null) profile.setPhone(updated.get("phone").trim());
        if (updated.get("address") != null) profile.setAddress(updated.get("address").trim());

        StoreProfile saved = storeProfileRepository.save(profile);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Store profile updated successfully",
                "storeProfile", saved
        ));
    }
}
