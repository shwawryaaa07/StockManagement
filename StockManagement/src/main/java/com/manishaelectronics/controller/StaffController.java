package com.manishaelectronics.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    private static String masterOwnerPin = "2006";

    private static final List<Map<String, Object>> staffAccounts = new CopyOnWriteArrayList<>(List.of(
            new HashMap<>(Map.of(
                    "id", "STF-01",
                    "name", "Tejas",
                    "username", "tejas11",
                    "pin", "0987",
                    "role", "Inventory Specialist",
                    "status", "Active",
                    "dateAdded", "2026-08-31"
            )),
            new HashMap<>(Map.of(
                    "id", "STF-02",
                    "name", "Rahul Parab",
                    "username", "rahul_counter1",
                    "pin", "1234",
                    "role", "Cashier",
                    "status", "Active",
                    "dateAdded", "2026-08-15"
            )),
            new HashMap<>(Map.of(
                    "id", "STF-03",
                    "name", "Sunil Gawas",
                    "username", "sunil_counter2",
                    "pin", "5678",
                    "role", "Floor Sales Executive",
                    "status", "Active",
                    "dateAdded", "2026-08-20"
            ))
    ));

    // GET /api/staff - List all staff
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getStaffList() {
        return ResponseEntity.ok(new ArrayList<>(staffAccounts));
    }

    // POST /api/staff - Sync or Add staff profile
    @PostMapping
    public ResponseEntity<?> addOrUpdateStaff(@RequestBody Map<String, Object> newStaff) {
        String username = (String) newStaff.get("username");
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
        }

        // Check if exists, update or append
        boolean updated = false;
        for (int i = 0; i < staffAccounts.size(); i++) {
            Map<String, Object> existing = staffAccounts.get(i);
            if (username.equalsIgnoreCase((String) existing.get("username")) ||
                (newStaff.get("id") != null && newStaff.get("id").equals(existing.get("id")))) {
                staffAccounts.set(i, new HashMap<>(newStaff));
                updated = true;
                break;
            }
        }

        if (!updated) {
            if (newStaff.get("id") == null) {
                newStaff.put("id", "STF-0" + (staffAccounts.size() + 1));
            }
            if (newStaff.get("status") == null) {
                newStaff.put("status", "Active");
            }
            staffAccounts.add(new HashMap<>(newStaff));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Staff account synchronized successfully",
                "staff", staffAccounts
        ));
    }

    // DELETE /api/staff/{id} - Delete staff profile
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStaff(@PathVariable String id) {
        staffAccounts.removeIf(s -> id.equalsIgnoreCase(String.valueOf(s.get("id"))) ||
                                   id.equalsIgnoreCase(String.valueOf(s.get("username"))));
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Staff profile deleted",
                "staff", staffAccounts
        ));
    }

    // GET /api/staff/pin - Get master PIN status
    @GetMapping("/pin")
    public ResponseEntity<?> getMasterPin() {
        return ResponseEntity.ok(Map.of(
                "masterPin", masterOwnerPin
        ));
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
        return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Invalid PIN format"
        ));
    }
}
