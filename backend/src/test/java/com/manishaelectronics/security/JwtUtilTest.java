package com.manishaelectronics.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private final String secretKey = "test-jwt-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256";

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(secretKey, 1); // 1 day expiry
    }

    @Test
    void testGenerateAndValidateToken() {
        String token = jwtUtil.generateToken("testuser", "ROLE_OWNER", "PROD");
        assertNotNull(token);
        assertTrue(jwtUtil.validateToken(token));
        assertEquals("testuser", jwtUtil.getUsernameFromToken(token));
        assertEquals("ROLE_OWNER", jwtUtil.getRoleFromToken(token));
        assertEquals("PROD", jwtUtil.getTenantTypeFromToken(token));
    }

    @Test
    void testValidateTokenWithTamperedSignature() {
        String token = jwtUtil.generateToken("validuser", "ROLE_STAFF", "PROD");
        String tamperedToken = token.substring(0, token.length() - 5) + "abcde";

        assertFalse(jwtUtil.validateToken(tamperedToken));
    }

    @Test
    void testValidateInvalidTokenString() {
        assertFalse(jwtUtil.validateToken("not-a-valid-token"));
        assertFalse(jwtUtil.validateToken(""));
        assertFalse(jwtUtil.validateToken(null));
    }

    @Test
    void testTokenExpirationValidation() {
        // JwtUtil with 0 days expiration
        JwtUtil expiredJwtUtil = new JwtUtil(secretKey, -1);
        String expiredToken = expiredJwtUtil.generateToken("olduser", "ROLE_STAFF", "PROD");

        assertFalse(jwtUtil.validateToken(expiredToken));
    }
}
