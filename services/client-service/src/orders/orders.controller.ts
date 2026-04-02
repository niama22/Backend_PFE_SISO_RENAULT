import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ImportOrderDto } from './dto/import-order.dto';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ─── POST /orders ─────────────────────────────────────────────────────────
  @Post()
  createOrder(@Body() dto: CreateOrderDto, @Request() req) {
    return this.ordersService.createOrder(dto, req.user);
  }

  // ─── GET /orders ──────────────────────────────────────────────────────────
  /** Returns all orders belonging to the authenticated client */
  @Get()
  getMyOrders(@Request() req) {
    return this.ordersService.getClientOrders(req.user.id);
  }

  // ─── GET /orders/:id ──────────────────────────────────────────────────────
  @Get(':id')
  getOrder(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.ordersService.getOrderByIdForClient(id, req.user.id);
  }

  // ─── PUT /orders/:id ──────────────────────────────────────────────────────
  /** Full or partial update (only while status = PENDING) */
  @Put(':id')
  updateOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderDto,
    @Request() req,
  ) {
    return this.ordersService.updateOrder(id, dto, req.user.id);
  }

  // ─── PATCH /orders/:id/cancel ─────────────────────────────────────────────
  @Patch(':id/cancel')
  cancelOrder(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.ordersService.cancelOrder(id, req.user.id);
  }

  // ─── DELETE /orders/:id ───────────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteOrder(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.ordersService.deleteOrder(id, req.user.id);
  }

  // ─── POST /orders/import ─────────────────────────────────────────────────
  /**
   * Upload a CSV or Excel file to create an order automatically.
   *
   * Expected columns (case-insensitive):
   *   vehicleModel | quantity | deliveryAddress | deliveryCity | notes
   *
   * deliveryAddress / deliveryCity / notes can also be passed as form fields
   * and will take precedence over values read from the file.
   *
   * Example multipart/form-data:
   *   file          → orders.csv / orders.xlsx
   *   deliveryCity  → "Casablanca"   (optional override)
   */
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),           // keep file in RAM as buffer
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'text/csv',
          'application/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        const name = file.originalname.toLowerCase();
        if (
          allowed.includes(file.mimetype) ||
          name.endsWith('.csv') ||
          name.endsWith('.xlsx') ||
          name.endsWith('.xls')
        ) {
          cb(null, true);
        } else {
          cb(
            new Error(
              'Format non supporté. Seuls les fichiers CSV et Excel sont acceptés.',
            ),
            false,
          );
        }
      },
    }),
  )
  importOrder(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportOrderDto,
    @Request() req,
  ) {
    if (!file) {
      throw new Error('Aucun fichier reçu');
    }
    return this.ordersService.importOrderFromFile(file, dto, req.user);
  }
}