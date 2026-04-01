import { Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Client } from '../clients/client.entity';
export declare class OrdersService {
    private readonly orderRepository;
    constructor(orderRepository: Repository<Order>);
    createOrder(dto: CreateOrderDto, client: Client): Promise<Order>;
    getClientOrders(clientId: string): Promise<Order[]>;
    getOrderById(id: string): Promise<Order>;
    getOrderByIdForClient(id: string, clientId: string): Promise<Order>;
    updateStatus(id: string, status: OrderStatus): Promise<Order>;
    cancelOrder(id: string, clientId: string): Promise<Order>;
    getAllOrders(): Promise<Order[]>;
}
