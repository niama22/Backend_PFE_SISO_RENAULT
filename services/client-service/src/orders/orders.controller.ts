import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() dto: CreateOrderDto, @Request() req) {
    return this.ordersService.createOrder(dto, req.user);
  }

  @Get()
  getMyOrders(@Request() req) {
    return this.ordersService.getClientOrders(req.user.id);
  }

  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }
}