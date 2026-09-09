package com.manishaelectronics.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory sliding window rate limiter per client IP address.
 * Prevents API abuse, DDoS, and authentication brute-force attacks.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_GENERAL_REQUESTS_PER_MINUTE = 150;
    private static final int MAX_AUTH_REQUESTS_PER_MINUTE = 25;
    private static final long WINDOW_MS = 60_000L; // 1 minute window

    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();

    private static class RequestCounter {
        private final AtomicInteger count = new AtomicInteger(0);
        private volatile long windowStartTime = System.currentTimeMillis();

        public synchronized int incrementAndGet() {
            long now = System.currentTimeMillis();
            if (now - windowStartTime > WINDOW_MS) {
                count.set(0);
                windowStartTime = now;
            }
            return count.incrementAndGet();
        }

        public boolean isStale(long cutoffTime) {
            return windowStartTime < cutoffTime;
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Always allow CORS preflight requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Bounded cache maintenance to prevent memory leaks under IP rotation/scanning
        if (requestCounts.size() > 5000) {
            long cutoff = System.currentTimeMillis() - (WINDOW_MS * 2);
            requestCounts.entrySet().removeIf(entry -> entry.getValue().isStale(cutoff));
        }

        String clientIp = getClientIp(request);
        String path = request.getRequestURI();

        boolean isAuthEndpoint = path != null && path.contains("/api/auth/");
        int limit = isAuthEndpoint ? MAX_AUTH_REQUESTS_PER_MINUTE : MAX_GENERAL_REQUESTS_PER_MINUTE;

        String key = clientIp + ":" + (isAuthEndpoint ? "auth" : "gen");
        RequestCounter counter = requestCounts.computeIfAbsent(key, k -> new RequestCounter());

        int currentRequests = counter.incrementAndGet();

        // Include rate limit headers
        response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - currentRequests)));

        if (currentRequests > limit) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", "60");
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please try again in a minute.\"}"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank() && !"unknown".equalsIgnoreCase(xfHeader)) {
            String candidate = xfHeader.split(",")[0].trim();
            if (candidate.matches("^[0-9a-fA-F:.]+$") && candidate.length() <= 45) {
                return candidate;
            }
        }
        String remote = request.getRemoteAddr();
        return (remote != null && !remote.isBlank()) ? remote.trim() : "127.0.0.1";
    }
}
