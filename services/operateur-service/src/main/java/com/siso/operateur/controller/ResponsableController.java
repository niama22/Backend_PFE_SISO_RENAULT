package com.siso.operateur.controller;

import com.siso.operateur.model.OrderEvent;
import com.siso.operateur.service.OrderConsumerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Tableau de bord Responsable.
 * Le responsable peut consulter les statistiques globales sur les commandes,
 * mais n'accède pas aux mêmes endpoints que l'opérateur.
 */
@RestController
@RequestMapping("/api/responsable")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasAuthority('ROLE_RESPONSABLE')")
public class ResponsableController {

    private final OrderConsumerService orderConsumerService;

    /**
     * Résumé statistique des commandes (par statut, par ville).
     */
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        List<OrderEvent> orders = orderConsumerService.getAllOrders();

        Map<String, Long> byStatus = orders.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getStatus() != null ? o.getStatus() : "INCONNU",
                        Collectors.counting()));

        Map<String, Long> byCity = orders.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getDeliveryCity() != null ? o.getDeliveryCity() : "INCONNUE",
                        Collectors.counting()));

        return ResponseEntity.ok(Map.of(
                "totalCommandes", orders.size(),
                "parStatut", byStatus,
                "parVille", byCity
        ));
    }

    /**
     * Liste des commandes avec vue agrégée (sans données client sensibles).
     */
    @GetMapping("/orders/summary")
    public ResponseEntity<?> getOrdersSummary() {
        List<Map<String, Object>> summary = orderConsumerService.getAllOrders()
                .stream()
                .map(o -> Map.<String, Object>of(
                        "orderId", o.getOrderId() != null ? o.getOrderId() : "",
                        "status",  o.getStatus()  != null ? o.getStatus()  : "",
                        "city",    o.getDeliveryCity() != null ? o.getDeliveryCity() : "",
                        "itemCount", o.getItems() != null ? o.getItems().size() : 0,
                        "createdAt", o.getCreatedAt() != null ? o.getCreatedAt().toString() : ""
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(summary);
    }
}
