package com.manishaelectronics.model;

import jakarta.persistence.*;

@Entity
@Table(name = "store_profile")
public class StoreProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String shopName;

    private String ownerName;
    private String gstin;
    private String phone;
    private String address;
    private String upiId;

    public StoreProfile() {}

    public StoreProfile(String shopName, String ownerName, String gstin, String phone, String address, String upiId) {
        this.shopName = shopName;
        this.ownerName = ownerName;
        this.gstin = gstin;
        this.phone = phone;
        this.address = address;
        this.upiId = upiId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getShopName() { return shopName; }
    public void setShopName(String shopName) { this.shopName = shopName; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }
}
