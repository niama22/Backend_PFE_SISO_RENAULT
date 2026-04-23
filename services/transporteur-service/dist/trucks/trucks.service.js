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
exports.TrucksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const driver_entity_1 = require("../drivers/driver.entity");
const truck_entity_1 = require("./truck.entity");
let TrucksService = class TrucksService {
    truckRepository;
    driverRepository;
    constructor(truckRepository, driverRepository) {
        this.truckRepository = truckRepository;
        this.driverRepository = driverRepository;
    }
    async createTruck(dto) {
        const exists = await this.truckRepository.findOne({
            where: { matricule: dto.matricule },
        });
        if (exists)
            throw new common_1.ConflictException('Matricule already used');
        const driver = await this.driverRepository.findOne({
            where: { id: dto.driverId },
        });
        if (!driver)
            throw new common_1.NotFoundException(`Driver #${dto.driverId} not found`);
        const truck = this.truckRepository.create({
            matricule: dto.matricule,
            capacity: dto.capacity,
            order: dto.order,
            location: dto.location,
            driver,
        });
        return this.truckRepository.save(truck);
    }
    async getAllTrucks() {
        return this.truckRepository.find({ order: { createdAt: 'DESC' } });
    }
    async getTruckById(id) {
        const truck = await this.truckRepository.findOne({ where: { id } });
        if (!truck)
            throw new common_1.NotFoundException(`Truck #${id} not found`);
        return truck;
    }
};
exports.TrucksService = TrucksService;
exports.TrucksService = TrucksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(truck_entity_1.Truck)),
    __param(1, (0, typeorm_1.InjectRepository)(driver_entity_1.Driver)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TrucksService);
//# sourceMappingURL=trucks.service.js.map