declare class OrderItemDto {
    vehicleModel: string;
    quantity: number;
}
export declare class CreateOrderDto {
    items: OrderItemDto[];
    deliveryAddress: string;
    deliveryCity: string;
    notes?: string;
}
export {};
