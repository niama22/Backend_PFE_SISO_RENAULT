import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Truck } from './truck.entity';
import { TrucksService } from './trucks.service';
import { TrucksController } from './trucks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Truck])],
  controllers: [TrucksController],
  providers: [TrucksService],
  exports: [TrucksService, TypeOrmModule],
})
export class TrucksModule {}
