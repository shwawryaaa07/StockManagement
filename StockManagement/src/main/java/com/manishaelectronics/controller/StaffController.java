package com.manishaelectronics.controller;

import com.manishaelectronics.model.StaffAccount;
import com.manishaelectronics.repository.StaffAccountRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    private final StaffAccountRepository staffAccountRepository;
    private static String masterOwnerPin = "2006";

    public StaffController(StaffAccountRepository staffAccountRepository) {
        this.staffAccountRepository = staffAccountRepository;
    }

    // GET /api/staff - List all staff accounts from MySQL
    @GetMapping
    public ResponseEntity<List<StaffAccount>> getStaffList() {
        List<StaffAccount> list = staffAccountRepository.findAll();
        // If first time initialization, seed with Tejas
        if (list.isEmpty()) {
            StaffAccount initial = new StaffAccount(
                    "STF-01",
                    "Tejas",
                    "tejas11",
                    "0987",
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
    public ResponseEntity<?> addOrUpdateStaff(@RequestBody Map<String, Object> request) {
        String username = (String) request.get("username");
        String name = (String) request.get("name");
        String pin = (String) request.get("pin");
        String role = (String) request.get("role");
        String status = (String) request.get("status");

        if (username == null || username.isBlank() || name == null || pin == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name, username, and PIN are required"));
        }

        Optional<StaffAccount> existingOpt = staffAccountRepository.findByUsernameIgnoreCase(username.trim());
        StaffAccount staff;
        if (existingOpt.isPresent()) {
            staff = existingOpt.get();
            staff.setName(name.trim());
            staff.setPin(pin.trim());
            if (role != null) staff.setRole(role.trim());
            if (status != null) staff.setStatus(status.trim());
        } else {
            long count = staffAccountRepository.count() + 1;
            String code = (String) request.get("id");
            if (code == null || code.isBlank()) {
                code = "STF-0" + count;
            }
            staff = new StaffAccount(
                    code,
                    name.trim(),
                    username.trim(),
                    pin.trim(),
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
    public ResponseEntity<?> deleteStaff(@PathVariable String id) {
        // Try deleting by Long id, staffCode, or username
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

    // GET /api/staff/pin - Get master PIN
    @GetMapping("/pin")
    public ResponseEntity<?> getMasterPin() {
        return ResponseEntity.ok(Map.of("masterPin", masterOwnerPin));
    }

    // POST /api/staff/pin - Update master PIN
    @PostMapping("/pin")
    public ResponseEntity<?> updateMasterPin(@RequestBody Map<String, String> request) {
        String newPin = request.get("newPin");
        if (newPin != null && newPin.trim().length() >= 4) {
            masterOwnerPin = newPin.trim();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Owner Master PIN updated successfully",
                    "masterPin", masterOwnerPin
            ));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "PIN must be at least 4 digits"));
    }
}
