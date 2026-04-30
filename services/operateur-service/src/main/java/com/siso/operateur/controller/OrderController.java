package com.siso.operateur.controller;

import com.siso.operateur.model.OrderEvent;
import com.siso.operateur.service.OrderConsumerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/operateur/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderConsumerService orderConsumerService;

    @GetMapping
    public ResponseEntity<List<OrderEvent>> getAllOrders() {
        return ResponseEntity.ok(orderConsumerService.getAllOrders());
    }
     @GetMapping("/test")
    public String test() {
        return "hello niama";
    }
}
