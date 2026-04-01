import { Client } from '../clients/client.entity';
export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    IN_TRANSIT = "in_transit",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export declare class Order {
    id: string;
    client: Client;
    items: {
        vehicleModel: string;
        quantity: number;
    }[];
    status: OrderStatus;
    deliveryAddress: string;
    deliveryCity: string;
    notes: string;
    createdAt: Date;
}
