import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DriversService } from './drivers.service';
import { RegisterDriverDto } from './dto/register-driver.dto';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post('register')
  register(@Body() dto: RegisterDriverDto) {
    return this.driversService.register(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req) {
    return this.driversService.getProfile(req.user.id);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  updateProfile(@Body() dto: Partial<RegisterDriverDto>, @Request() req) {
    return this.driversService.updateProfile(req.user.id, dto);
  }

  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  deactivate(@Request() req) {
    return this.driversService.deactivate(req.user.id);
  }
}
