package com.manishaelectronics;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"DB_URL=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
		"DB_USERNAME=sa",
		"DB_PASSWORD=",
		"JWT_SECRET=test-jwt-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256",
		"ADMIN_USERNAME=admin",
		"ADMIN_PASSWORD=adminpassword",
		"ADMIN_PIN=1234"
})
class StockManagementApplicationTests {

	@Test
	void contextLoads() {
	}
}