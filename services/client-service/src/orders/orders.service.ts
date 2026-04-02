import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ImportOrderDto } from './dto/import-order.dto';
import { Client } from '../clients/client.entity';

// ─── Expected CSV / Excel column names (case-insensitive) ─────────────────────
// | vehicleModel | quantity | deliveryAddress | deliveryCity | notes |
// ──────────────────────────────────────────────────────────────────────────────

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────
  async createOrder(dto: CreateOrderDto, client: Client): Promise<Order> {
    const order = this.orderRepository.create({
      client,
      items: dto.items,
      deliveryAddress: dto.deliveryAddress,
      deliveryCity: dto.deliveryCity,
      notes: dto.notes,
      status: OrderStatus.PENDING,
    });

    return this.orderRepository.save(order);
  }

  // ─── READ ALL (client) ────────────────────────────────────────────────────
  async getClientOrders(clientId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── READ ALL (admin) ─────────────────────────────────────────────────────
  async getAllOrders(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });
  }

  // ─── READ ONE ─────────────────────────────────────────────────────────────
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

  // ─── READ ONE (client-scoped) ─────────────────────────────────────────────
  async getOrderByIdForClient(id: string, clientId: string): Promise<Order> {
    const order = await this.getOrderById(id);

    if (order.client.id !== clientId) {
      throw new ForbiddenException(`Accès refusé à la commande #${id}`);
    }

    return order;
  }

  // ─── UPDATE (client can only edit PENDING orders) ─────────────────────────
  async updateOrder(
    id: string,
    dto: UpdateOrderDto,
    clientId: string,
  ): Promise<Order> {
    const order = await this.getOrderByIdForClient(id, clientId);

    if (order.status !== OrderStatus.PENDING) {
      throw new ForbiddenException(
        'Seules les commandes en attente peuvent être modifiées',
      );
    }

    Object.assign(order, {
      ...(dto.items !== undefined && { items: dto.items }),
      ...(dto.deliveryAddress !== undefined && {
        deliveryAddress: dto.deliveryAddress,
      }),
      ...(dto.deliveryCity !== undefined && { deliveryCity: dto.deliveryCity }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    });

    return this.orderRepository.save(order);
  }

  // ─── UPDATE STATUS (admin) ────────────────────────────────────────────────
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.getOrderById(id);
    order.status = status;
    return this.orderRepository.save(order);
  }

  // ─── DELETE (client – only PENDING) ──────────────────────────────────────
  async deleteOrder(id: string, clientId: string): Promise<{ message: string }> {
    const order = await this.getOrderByIdForClient(id, clientId);

    if (order.status !== OrderStatus.PENDING) {
      throw new ForbiddenException(
        'Seules les commandes en attente peuvent être supprimées',
      );
    }

    await this.orderRepository.remove(order);
    return { message: `Commande #${id} supprimée avec succès` };
  }

  // ─── DELETE (admin – any status) ─────────────────────────────────────────
  async adminDeleteOrder(id: string): Promise<{ message: string }> {
    const order = await this.getOrderById(id);
    await this.orderRepository.remove(order);
    return { message: `Commande #${id} supprimée avec succès` };
  }

  // ─── CANCEL (client) ─────────────────────────────────────────────────────
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

  // ─── IMPORT CSV / EXCEL ───────────────────────────────────────────────────
  async importOrderFromFile(
    file: Express.Multer.File,
    dto: ImportOrderDto,
    client: Client,
  ): Promise<Order> {
    const rows = this.parseFile(file);

    if (rows.length === 0) {
      throw new BadRequestException(
        'Le fichier importé ne contient aucune ligne valide',
      );
    }

    // Normalise column names to lowercase, trimmed keys
    const normalised = rows.map((row) => {
      const entry: Record<string, string> = {};
      for (const [k, v] of Object.entries(row)) {
        entry[k.trim().toLowerCase()] = String(v ?? '').trim();
      }
      return entry;
    });

    // Build items from rows
    const items: { vehicleModel: string; quantity: number }[] = [];
    let fileDeliveryAddress: string | undefined;
    let fileDeliveryCity: string | undefined;
    let fileNotes: string | undefined;

    for (const [index, row] of normalised.entries()) {
      const vehicleModel =
        row['vehiclemodel'] || row['vehicle_model'] || row['modele'] || row['model'];
      const quantityRaw =
        row['quantity'] || row['quantite'] || row['quantité'] || row['qty'];

      if (!vehicleModel) {
        throw new BadRequestException(
          `Ligne ${index + 2}: colonne "vehicleModel" manquante ou vide`,
        );
      }

      const quantity = parseInt(quantityRaw, 10);
      if (!quantityRaw || isNaN(quantity) || quantity < 1) {
        throw new BadRequestException(
          `Ligne ${index + 2}: "quantity" doit être un entier ≥ 1 (valeur reçue: "${quantityRaw}")`,
        );
      }

      items.push({ vehicleModel, quantity });

      // Pick address/city/notes from the first row if not supplied via DTO
      if (index === 0) {
        fileDeliveryAddress =
          row['deliveryaddress'] ||
          row['delivery_address'] ||
          row['adresse'] ||
          undefined;
        fileDeliveryCity =
          row['deliverycity'] ||
          row['delivery_city'] ||
          row['ville'] ||
          undefined;
        fileNotes = row['notes'] || undefined;
      }
    }

    const order = this.orderRepository.create({
      client,
      items,
      deliveryAddress: dto.deliveryAddress ?? fileDeliveryAddress ?? '',
      deliveryCity: dto.deliveryCity ?? fileDeliveryCity ?? '',
      notes: dto.notes ?? fileNotes,
      status: OrderStatus.PENDING,
    });

    return this.orderRepository.save(order);
  }

  // ─── FILE PARSER (CSV + Excel) ────────────────────────────────────────────
  private parseFile(file: Express.Multer.File): Record<string, unknown>[] {
    const mimeType = file.mimetype;
    const originalName = file.originalname.toLowerCase();

    const isExcel =
      mimeType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel' ||
      originalName.endsWith('.xlsx') ||
      originalName.endsWith('.xls');

    const isCsv =
      mimeType === 'text/csv' ||
      mimeType === 'application/csv' ||
      originalName.endsWith('.csv');

    if (isExcel) {
      return this.parseExcel(file.buffer);
    }

    if (isCsv) {
      return this.parseCsv(file.buffer.toString('utf-8'));
    }

    throw new BadRequestException(
      'Format de fichier non supporté. Utilisez CSV (.csv) ou Excel (.xlsx / .xls)',
    );
  }

  private parseExcel(buffer: Buffer): Record<string, unknown>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new BadRequestException('Le fichier Excel ne contient aucune feuille');
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });

    return rows;
  }

  private parseCsv(content: string): Record<string, unknown>[] {
    const result = Papa.parse<Record<string, unknown>>(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    if (result.errors.length > 0) {
      const firstError = result.errors[0];
      throw new BadRequestException(
        `Erreur CSV ligne ${firstError.row}: ${firstError.message}`,
      );
    }

    return result.data;
  }
}