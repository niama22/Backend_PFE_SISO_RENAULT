package com.siso.operateur.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderEvent {
    private String orderId;
    private String clientId;
    private String clientEmail;
    private List<OrderItem> items;
    private String deliveryAddress;
    private String deliveryCity;
    private String notes;
    private String status;
    private Instant createdAt;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OrderItem {
        private String vehicleModel;
        private int quantity;
    }
}
