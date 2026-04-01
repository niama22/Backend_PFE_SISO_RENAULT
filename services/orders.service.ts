import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Client } from '../clients/client.entity';
import { Kafka } from 'kafkajs';

const kafka = new Kafka({ brokers: [process.env.KAFKA_BROKER || 'kafka:9092'] });
const producer = kafka.producer();

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  async createOrder(dto: CreateOrderDto, client: Client) {
    const order = this.orderRepo.create({ ...dto, client });
    await this.orderRepo.save(order);

    // Publier sur Kafka → order.created
    await producer.connect();
    await producer.send({
      topic: 'order.created',
      messages: [{ value: JSON.stringify({ orderId: order.id, clientId: client.id, items: order.items }) }],
    });

    return order;
  }

  async getClientOrders(clientId: string) {
    return this.orderRepo.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getOrderById(id: string) {
    return this.orderRepo.findOne({ where: { id }, relations: ['client'] });
  }
}