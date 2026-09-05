package com.manishaelectronics.controller;

import com.manishaelectronics.model.StaffAccount;
import com.manishaelectronics.repository.StaffAccountRepository;
import com.manishaelectronics.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtUtil jwtUtil;
    private final StaffAccountRepository staffAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminUsername;
    private final String adminPassword;
    private final String adminPin;
    private final String shopName;

    // Brute-force protection: IP -> [failedCount, lockUntilTimestamp]
    private static final Map<String, long[]> attemptCache = new ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 10;
    private static final long LOCK_DURATION_MS = 2 * 60 * 1000L; // 2 minutes

    public AuthController(
            JwtUtil jwtUtil,
            StaffAccountRepository staffAccountRepository,
            PasswordEncoder passwordEncoder,
            @Value("${auth.admin.username:Ramesh Naik}") String adminUsername,
            @Value("${auth.admin.password}") String adminPassword,
            @Value("${auth.admin.pin}") String adminPin,
            @Value("${shop.name:MANISHA ELECTRONICS}") String shopName
    ) {
        this.jwtUtil = jwtUtil;
        this.staffAccountRepository = staffAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
        this.adminPin = adminPin;
        this.shopName = shopName;
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }

    // 1. Owner / Admin Login (Master PIN or Password)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
        String clientKey = "owner_" + getClientIp(httpRequest);

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
        String passcode = request.get("passcode");
        String username = request.get("username");
        String password = request.get("password");

        String input = passcode != null && !passcode.isBlank() ? passcode.trim() : (pin != null ? pin.trim() : null);

        boolean isAuthenticated = false;

        if (input != null && !input.isBlank()) {
            if (input.equals(adminPin) || input.equals(adminPassword) || passwordEncoder.matches(input, adminPassword) || passwordEncoder.matches(input, adminPin)) {
                isAuthenticated = true;
            }
        } else if (username != null && password != null) {
            if (adminUsername.equalsIgnoreCase(username.trim()) &&
                    (adminPassword.equals(password.trim()) || passwordEncoder.matches(password.trim(), adminPassword))) {
                isAuthenticated = true;
            }
        }

        if (isAuthenticated) {
            attemptCache.remove(clientKey);
            String token = jwtUtil.generateToken(adminUsername, "ROLE_OWNER", "PROD");
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "token", token,
                    "username", "Ramesh Naik (Owner)",
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
    @PostMapping(value = {"/staff", "/staff-login"})
    public ResponseEntity<?> staffLogin(@RequestBody Map<String, String> request) {
        String pin = request.get("pin");
        String username = request.get("username");

        if (username == null || username.isBlank() || pin == null || pin.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "⚠️ Username and PIN are required."
            ));
        }

        String inputUser = username.trim();
        String inputPin = pin.trim();

        // 1. Check in MySQL Database
        Optional<StaffAccount> staffOpt = staffAccountRepository.findByUsernameIgnoreCase(inputUser);
        if (staffOpt.isPresent()) {
            StaffAccount staff = staffOpt.get();
            if ("Suspended".equalsIgnoreCase(staff.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "success", false,
                        "message", "⛔ Staff account for \"" + staff.getName() + "\" is suspended."
                ));
            }

            boolean pinMatches = false;
            if (staff.getPin() != null) {
                if (passwordEncoder.matches(inputPin, staff.getPin())) {
                    pinMatches = true;
                } else if (staff.getPin().equals(inputPin)) {
                    // Transparent auto-upgrade plaintext PIN to BCrypt
                    pinMatches = true;
                    staff.setPin(passwordEncoder.encode(inputPin));
                    staffAccountRepository.save(staff);
                }
            }

            if (pinMatches) {
                String token = jwtUtil.generateToken(staff.getName(), "ROLE_STAFF", "PROD");
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "token", token,
                        "username", staff.getName() + " (" + (staff.getRole() != null ? staff.getRole() : "Staff") + ")",
                        "role", "STAFF",
                        "tenantType", "PROD",
                        "shopName", shopName
                ));
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "success", false,
                "message", "❌ Invalid Staff ID or PIN. Please check your credentials."
        ));
    }

    // 3. 1-Click Visitor / Demo Sandbox Login
    @PostMapping(value = {"/visitor", "/visitor-login"})
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
                "message", "Token expired or invalid"
        ));
    }
}
