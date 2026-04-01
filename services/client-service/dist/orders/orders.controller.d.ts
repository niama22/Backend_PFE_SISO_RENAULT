import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersController {
    private ordersService;
    constructor(ordersService: OrdersService);
    createOrder(dto: CreateOrderDto, req: any): Promise<import("./order.entity").Order>;
    getMyOrders(req: any): Promise<import("./order.entity").Order[]>;
    getOrder(id: string): Promise<import("./order.entity").Order>;
}
