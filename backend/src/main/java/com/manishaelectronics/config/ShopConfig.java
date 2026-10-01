package com.manishaelectronics.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ShopConfig {

    @Value("${shop.name:MANISHA ELECTRONICS}")
    private String name;

    @Value("${shop.address:EDEN GROVE Building, Nr. State Bank of India, Valpoi, Goa}")
    private String address;

    @Value("${shop.phone:9309736172}")
    private String phone;

    @Value("${shop.gstin:30AMYPN1753F1ZY}")
    private String gstin;

    public String getName() { return name; }
    public String getAddress() { return address; }
    public String getPhone() { return phone; }
    public String getGstin() { return gstin; }
}