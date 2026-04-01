import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Client } from '../clients/client.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  // ─── Créer une commande ───────────────────────────────────────────────────
  async createOrder(dto: CreateOrderDto, client: Client): Promise<Order> {
    const order = this.orderRepository.create({
      client,
      items: dto.items,
      deliveryAddress: dto.deliveryAddress,
      deliveryCity: dto.deliveryCity,   // ✅ champ ville
      notes: dto.notes,
      status: OrderStatus.PENDING,
    });

    return this.orderRepository.save(order);
  }

  // ─── Toutes les commandes d'un client ─────────────────────────────────────
  async getClientOrders(clientId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Une commande par ID ───────────────────────────────────────────────────
  async getOrderById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['client'],
    });

    if (!order) {
      throw new NotFoundException(`Commande #${id} introuvable`);
    }

    return order;
  }

  // ─── Vérifier que la commande appartient au client ────────────────────────
  async getOrderByIdForClient(id: string, clientId: string): Promise<Order> {
    const order = await this.getOrderById(id);

    if (order.client.id !== clientId) {
      throw new ForbiddenException(`Accès refusé à la commande #${id}`);
    }

    return order;
  }

  // ─── Mettre à jour le statut (usage admin) ────────────────────────────────
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.getOrderById(id);
    order.status = status;
    return this.orderRepository.save(order);
  }

  // ─── Annuler une commande (client) ────────────────────────────────────────
  async cancelOrder(id: string, clientId: string): Promise<Order> {
    const order = await this.getOrderByIdForClient(id, clientId);

    if (order.status !== OrderStatus.PENDING) {
      throw new ForbiddenException(
        'Seules les commandes en attente peuvent être annulées',
      );
    }

    order.status = OrderStatus.CANCELLED;
    return this.orderRepository.save(order);
  }

  // ─── Toutes les commandes (usage admin) ───────────────────────────────────
  async getAllOrders(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });
  }
}