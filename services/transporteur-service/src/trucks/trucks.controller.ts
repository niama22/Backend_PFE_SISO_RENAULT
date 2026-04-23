import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateTruckDto } from './dto/create-truck.dto';
import { TrucksService } from './trucks.service';

@Controller('trucks')
@UseGuards(AuthGuard('jwt'))
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  @Post()
  createTruck(@Body() dto: CreateTruckDto) {
    return this.trucksService.createTruck(dto);
  }

  @Get()
  getAllTrucks() {
    return this.trucksService.getAllTrucks();
  }

  @Get(':id')
  getTruckById(@Param('id') id: string) {
    return this.trucksService.getTruckById(id);
  }
}
