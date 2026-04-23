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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Driver = exports.DriverStatus = void 0;
const typeorm_1 = require("typeorm");
const truck_entity_1 = require("../trucks/truck.entity");
var DriverStatus;
(function (DriverStatus) {
    DriverStatus["AVAILABLE"] = "available";
    DriverStatus["BUSY"] = "busy";
    DriverStatus["OFFLINE"] = "offline";
})(DriverStatus || (exports.DriverStatus = DriverStatus = {}));
let Driver = class Driver {
    id;
    email;
    password;
    fullName;
    phone;
    isActive;
    status;
    trucks;
    createdAt;
    updatedAt;
};
exports.Driver = Driver;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Driver.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Driver.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Driver.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Driver.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Driver.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Driver.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DriverStatus, default: DriverStatus.AVAILABLE }),
    __metadata("design:type", String)
], Driver.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => truck_entity_1.Truck, (truck) => truck.driver),
    __metadata("design:type", Array)
], Driver.prototype, "trucks", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Driver.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Driver.prototype, "updatedAt", void 0);
exports.Driver = Driver = __decorate([
    (0, typeorm_1.Entity)('drivers')
], Driver);
//# sourceMappingURL=driver.entity.js.map