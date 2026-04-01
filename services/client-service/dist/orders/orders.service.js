"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("./order.entity");
let OrdersService = class OrdersService {
    orderRepository;
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }
    async createOrder(dto, client) {
        const order = this.orderRepository.create({
            client,
            items: dto.items,
            deliveryAddress: dto.deliveryAddress,
            deliveryCity: dto.deliveryCity,
            notes: dto.notes,
            status: order_entity_1.OrderStatus.PENDING,
        });
        return this.orderRepository.save(order);
    }
    async getClientOrders(clientId) {
        return this.orderRepository.find({
            where: { client: { id: clientId } },
            order: { createdAt: 'DESC' },
        });
    }
    async getOrderById(id) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['client'],
        });
        if (!order) {
            throw new common_1.NotFoundException(`Commande #${id} introuvable`);
        }
        return order;
    }
    async getOrderByIdForClient(id, clientId) {
        const order = await this.getOrderById(id);
        if (order.client.id !== clientId) {
            throw new common_1.ForbiddenException(`Accès refusé à la commande #${id}`);
        }
        return order;
    }
    async updateStatus(id, status) {
        const order = await this.getOrderById(id);
        order.status = status;
        return this.orderRepository.save(order);
    }
    async cancelOrder(id, clientId) {
        const order = await this.getOrderByIdForClient(id, clientId);
        if (order.status !== order_entity_1.OrderStatus.PENDING) {
            throw new common_1.ForbiddenException('Seules les commandes en attente peuvent être annulées');
        }
        order.status = order_entity_1.OrderStatus.CANCELLED;
        return this.orderRepository.save(order);
    }
    async getAllOrders() {
        return this.orderRepository.find({
            relations: ['client'],
            order: { createdAt: 'DESC' },
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], OrdersService);
//# sourceMappingURL=orders.service.js.map