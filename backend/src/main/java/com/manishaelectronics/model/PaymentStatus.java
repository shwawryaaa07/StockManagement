package com.manishaelectronics.model;

public enum PaymentStatus {
    FULLY_PAID,      // Customer paid everything ✅
    PARTIALLY_PAID,  // Customer paid some money 🟡
    DUE              // Customer paid nothing yet 🟡
}