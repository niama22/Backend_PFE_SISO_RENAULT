import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from '../drivers/driver.entity';
import { Truck } from './truck.entity';
import { TrucksController } from './trucks.controller';
import { TrucksService } from './trucks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Truck, Driver])],
  controllers: [TrucksController],
  providers: [TrucksService],
})
export class TrucksModule {}
