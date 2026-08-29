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

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String clientKey = "auth_client"; // Global / client rate limiter

        // Check brute-force lock
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

        // 1. PIN-Based Auth (Option C)
        if (pin != null && !pin.isBlank()) {
            if (adminPin.equals(pin.trim())) {
                isAuthenticated = true;
            }
        }
        // 2. Username/Password Auth (Option C)
        else if (username != null && password != null) {
            if (adminUsername.equalsIgnoreCase(username.trim()) && adminPassword.equals(password)) {
                isAuthenticated = true;
            }
        }

        if (isAuthenticated) {
            // Reset failed attempts
            attemptCache.remove(clientKey);

            String token = jwtUtil.generateToken(adminUsername, "ROLE_ADMIN");
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "token", token,
                    "username", adminUsername,
                    "role", "ADMIN",
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
                    "message", "❌ Invalid PIN or Password. (" + (MAX_ATTEMPTS - attemptData[0]) + " attempts remaining)"
            ));
        }
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.getUsernameFromToken(token);
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "valid", true,
                        "username", username,
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
