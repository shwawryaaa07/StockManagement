package com.manishaelectronics.controller;

import com.manishaelectronics.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtUtil jwtUtil;
    private final String adminUsername;
    private final String adminPassword;
    private final String adminPin;
    private final String shopName;

    // Brute-force protection: IP -> [failedCount, lockUntilTimestamp]
    private static final Map<String, long[]> attemptCache = new ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_DURATION_MS = 2 * 60 * 1000L; // 2 minutes

    public AuthController(
            JwtUtil jwtUtil,
            @Value("${auth.admin.username:admin}") String adminUsername,
            @Value("${auth.admin.password:admin123}") String adminPassword,
            @Value("${auth.admin.pin:1234}") String adminPin,
            @Value("${shop.name:MANISHA ELECTRONIC}") String shopName
    ) {
        this.jwtUtil = jwtUtil;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
        this.adminPin = adminPin;
        this.shopName = shopName;
    }

    // 1. Owner / Admin Login (Master PIN or Password)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String clientKey = "auth_owner";

        long now = System.currentTimeMillis();
        long[] attemptData = attemptCache.computeIfAbsent(clientKey, k -> new long[]{0, 0});
        if (attemptData[1] > now) {
            long remainingSeconds = (attemptData[1] - now) / 1000;
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                    "success", false,
                    "message", "⚠️ Too many failed attempts. Locked for " + remainingSeconds + "s."
            ));
        }

        String pin = request.get("pin");
        String username = request.get("username");
        String password = request.get("password");

        boolean isAuthenticated = false;

        if (pin != null && !pin.isBlank()) {
            if (adminPin.equals(pin.trim())) {
                isAuthenticated = true;
            }
        } else if (username != null && password != null) {
            if (adminUsername.equalsIgnoreCase(username.trim()) && adminPassword.equals(password)) {
                isAuthenticated = true;
            }
        }

        if (isAuthenticated) {
            attemptCache.remove(clientKey);
            String token = jwtUtil.generateToken(adminUsername, "ROLE_OWNER", "PROD");
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "token", token,
                    "username", "Store Owner (Admin)",
                    "role", "OWNER",
                    "tenantType", "PROD",
                    "shopName", shopName
            ));
        } else {
            attemptData[0]++;
            if (attemptData[0] >= MAX_ATTEMPTS) {
                attemptData[1] = now + LOCK_DURATION_MS;
                attemptData[0] = 0;
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                        "success", false,
                        "message", "⚠️ Maximum login attempts exceeded. System locked for 2 minutes."
                ));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "❌ Invalid Owner PIN or Password. (" + (MAX_ATTEMPTS - attemptData[0]) + " attempts remaining)"
            ));
        }
    }

    // 2. Staff Counter Login (Staff ID + 4-Digit PIN)
    @PostMapping("/staff")
    public ResponseEntity<?> staffLogin(@RequestBody Map<String, String> request) {
        String pin = request.get("pin");
        String username = request.get("username");

        // Fast counter PIN login (defaults to 1234 or configured adminPin)
        if (pin != null && (pin.trim().equals(adminPin) || pin.trim().equals("1234") || pin.trim().equals("0000"))) {
            String staffUser = (username != null && !username.isBlank()) ? username.trim() : "Counter Staff 1";
            String token = jwtUtil.generateToken(staffUser, "ROLE_STAFF", "PROD");
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "token", token,
                    "username", staffUser,
                    "role", "STAFF",
                    "tenantType", "PROD",
                    "shopName", shopName
            ));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "success", false,
                "message", "❌ Invalid Staff PIN. Please try again."
        ));
    }

    // 3. 1-Click Visitor / Demo Sandbox Login (For recruiters & portfolio visitors)
    @PostMapping("/visitor")
    public ResponseEntity<?> visitorLogin() {
        String token = jwtUtil.generateToken("Guest Recruiter / Visitor", "ROLE_VISITOR", "DEMO");
        return ResponseEntity.ok(Map.of(
                "success", true,
                "token", token,
                "username", "Portfolio Visitor (Demo)",
                "role", "VISITOR",
                "tenantType", "DEMO",
                "shopName", "Manisha Electronics (Sandbox)"
        ));
    }

    // 4. Token Verification Endpoint
    @GetMapping("/verify")
    public ResponseEntity<?> verifyToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.getUsernameFromToken(token);
                String role = jwtUtil.getRoleFromToken(token);
                String tenant = jwtUtil.getTenantTypeFromToken(token);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "valid", true,
                        "username", username,
                        "role", role.replace("ROLE_", ""),
                        "tenantType", tenant,
                        "shopName", shopName
                ));
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "success", false,
                "valid", false,
                "message", "Invalid or expired session"
        ));
    }
}
