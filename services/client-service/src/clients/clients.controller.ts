import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClientsService } from './clients.service';
import { RegisterClientDto } from './dto/register-client.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // ─── GET /clients/me ── protégé ───────────────────────────────────────────
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req) {
    return this.clientsService.getProfile(req.user.id);
  }

  // ─── PATCH /clients/me ── protégé ─────────────────────────────────────────
  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  updateProfile(@Body() dto: Partial<RegisterClientDto>, @Request() req) {
    return this.clientsService.updateProfile(req.user.id, dto);
  }

  // ─── DELETE /clients/me ── protégé ────────────────────────────────────────
  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  deactivate(@Request() req) {
    return this.clientsService.deactivate(req.user.id);
  }
}