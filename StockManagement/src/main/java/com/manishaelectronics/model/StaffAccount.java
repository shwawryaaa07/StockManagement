package com.manishaelectronics.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "staff_accounts")
public class StaffAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String staffCode;

    @NotBlank(message = "Employee name is required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Login username is required")
    @Column(nullable = false, unique = true)
    private String username;

    @NotBlank(message = "PIN is required")
    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String pin;

    private String role;
    private String status = "Active";
    private String dateAdded;

    public StaffAccount() {
        this.status = "Active";
    }

    public StaffAccount(String staffCode, String name, String username, String pin, String role, String status, String dateAdded) {
        this.staffCode = staffCode;
        this.name = name;
        this.username = username;
        this.pin = pin;
        this.role = role;
        this.status = status != null ? status : "Active";
        this.dateAdded = dateAdded;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStaffCode() { return staffCode; }
    public void setStaffCode(String staffCode) { this.staffCode = staffCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDateAdded() { return dateAdded; }
    public void setDateAdded(String dateAdded) { this.dateAdded = dateAdded; }
}
