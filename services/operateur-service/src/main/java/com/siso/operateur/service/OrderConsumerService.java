package com.siso.operateur.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.siso.operateur.model.OrderEvent;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class OrderConsumerService {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    // In-memory store (replace with DB if needed)
    private final CopyOnWriteArrayList<OrderEvent> orders = new CopyOnWriteArrayList<>();

    @KafkaListener(topics = "orders.created", groupId = "operateur-group")
    public void consume(ConsumerRecord<String, String> record) {
        try {
            OrderEvent event = objectMapper.readValue(record.value(), OrderEvent.class);
            orders.add(event);
            log.info("✅ Nouvelle commande reçue: orderId={} client={} ville={}",
                    event.getOrderId(), event.getClientEmail(), event.getDeliveryCity());
        } catch (Exception e) {
            log.error("❌ Erreur parsing message Kafka: {}", e.getMessage());
        }
    }

    public List<OrderEvent> getAllOrders() {
        return new ArrayList<>(orders);
    }
}
