package com.manishaelectronics.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ShopConfig {

    @Value("${shop.name:Manisha Electronics}")
    private String name;

    @Value("${shop.address:123 Shop Street, City}")
    private String address;

    @Value("${shop.phone:9876543210}")
    private String phone;

    @Value("${shop.gstin:22AAAAA0000A1Z5}")
    private String gstin;

    public String getName() { return name; }
    public String getAddress() { return address; }
    public String getPhone() { return phone; }
    public String getGstin() { return gstin; }
}