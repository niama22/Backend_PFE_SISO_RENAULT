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
exports.TrucksController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const create_truck_dto_1 = require("./dto/create-truck.dto");
const trucks_service_1 = require("./trucks.service");
let TrucksController = class TrucksController {
    trucksService;
    constructor(trucksService) {
        this.trucksService = trucksService;
    }
    createTruck(dto) {
        return this.trucksService.createTruck(dto);
    }
    getAllTrucks() {
        return this.trucksService.getAllTrucks();
    }
    getTruckById(id) {
        return this.trucksService.getTruckById(id);
    }
};
exports.TrucksController = TrucksController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_truck_dto_1.CreateTruckDto]),
    __metadata("design:returntype", void 0)
], TrucksController.prototype, "createTruck", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TrucksController.prototype, "getAllTrucks", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrucksController.prototype, "getTruckById", null);
exports.TrucksController = TrucksController = __decorate([
    (0, common_1.Controller)('trucks'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [trucks_service_1.TrucksService])
], TrucksController);
//# sourceMappingURL=trucks.controller.js.map