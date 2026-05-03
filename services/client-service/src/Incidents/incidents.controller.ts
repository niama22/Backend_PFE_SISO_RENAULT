// incidents.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Logger,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IncidentStatus } from './enums/incident-status.enum';
import { IncidentType } from './enums/incident-type.enum';

type AuthenticatedRequest = { user: { id: string } };

// Configuration des uploads
const FILE_UPLOAD_CONFIG = {
  maxFiles: 5,
  maxFileSize: 5 * 1024 * 1024, // 5 MB
  allowedFormats: /jpeg|jpg|png|pdf/,
  destination: './uploads/incidents',
} as const;

@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  private readonly logger = new Logger(IncidentsController.name);

  constructor(private readonly incidentsService: IncidentsService) {}

  // ─────────────────────────────────────────────────────────────
  // POST /incidents
  // ✅ Client signale un nouvel incident
  // ─────────────────────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateIncidentDto,
  ) {
    this.logger.debug(`Creating incident for user ${req.user.id}`);
    return this.incidentsService.create(req.user.id, dto);
  }

  // ─────────────────────────────────────────────────────────────
  // POST /incidents/:id/attachments
  // ✅ Client upload des photos pour un incident existant
  // ─────────────────────────────────────────────────────────────
  @Post(':id/attachments')
  @UseInterceptors(
    FilesInterceptor('files', FILE_UPLOAD_CONFIG.maxFiles, {
      storage: diskStorage({
        destination: FILE_UPLOAD_CONFIG.destination,
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const filename = `incident-${uniqueSuffix}${extname(file.originalname)}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        const isValid = FILE_UPLOAD_CONFIG.allowedFormats.test(
          extname(file.originalname).toLowerCase(),
        );

        if (!isValid) {
          cb(
            new BadRequestException(
              `Format non supporté. Formats autorisés: jpeg, jpg, png, pdf`,
            ),
            false,
          );
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: FILE_UPLOAD_CONFIG.maxFileSize },
    }),
  )
  async uploadAttachments(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) {
      throw new BadRequestException('No files provided');
    }

    this.logger.debug(`Uploading ${files.length} files for incident ${id}`);

    const urls = files.map((file) => `/uploads/incidents/${file.filename}`);
    return this.incidentsService.addAttachments(id, req.user.id, urls);
  }

  // ─────────────────────────────────────────────────────────────
  // DELETE /incidents/:id/attachments
  // ✅ Client supprime un attachment
  // ─────────────────────────────────────────────────────────────
  @Delete(':id/attachments')
  @HttpCode(HttpStatus.OK)
  async removeAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body('url') attachmentUrl: string,
  ) {
    if (!attachmentUrl) {
      throw new BadRequestException('Attachment URL is required');
    }

    return this.incidentsService.removeAttachment(
      id,
      req.user.id,
      attachmentUrl,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // GET /incidents
  // ✅ Client consulte TOUS ses incidents
  // ─────────────────────────────────────────────────────────────
  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    this.logger.debug(`Fetching all incidents for user ${req.user.id}`);
    return this.incidentsService.findByClient(req.user.id);
  }

  // ─────────────────────────────────────────────────────────────
  // GET /incidents/stats
  // ✅ Client consulte ses statistiques
  // ─────────────────────────────────────────────────────────────
  @Get('stats')
  async getStats(@Req() req: AuthenticatedRequest) {
    this.logger.debug(`Fetching stats for user ${req.user.id}`);
    return this.incidentsService.getClientStats(req.user.id);
  }

  // ─────────────────────────────────────────────────────────────
  // GET /incidents/:id
  // ✅ Client consulte le détail d'un incident
  // ─────────────────────────────────────────────────────────────
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    this.logger.debug(`Fetching incident ${id} for user ${req.user.id}`);
    return this.incidentsService.findOne(id, req.user.id);
  }

  // ─────────────────────────────────────────────────────────────
  // PATCH /incidents/:id
  // ✅ Client modifie un incident (seulement si PENDING)
  // ─────────────────────────────────────────────────────────────
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateIncidentDto,
  ) {
    this.logger.debug(`Updating incident ${id} for user ${req.user.id}`);
    return this.incidentsService.update(id, req.user.id, dto);
  }

  // ─────────────────────────────────────────────────────────────
  // DELETE /incidents/:id
  // ✅ Client annule/supprime un incident (seulement si PENDING)
  // ─────────────────────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    this.logger.debug(`Cancelling incident ${id} for user ${req.user.id}`);
    return this.incidentsService.cancel(id, req.user.id);
  }

  // ─────────────────────────────────────────────────────────────
  // 👑 ADMIN ROUTES (à séparer dans un controller admin)
  // ─────────────────────────────────────────────────────────────

  // GET /incidents/admin/all
  @Get('admin/all')
  @UseGuards(JwtAuthGuard) // Ajouter AdminGuard
  async findAllForAdmin(
    @Query('status') status?: IncidentStatus,
    @Query('type') type?: IncidentType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.incidentsService.findAllForAdmin(
      status,
      type,
      page ? +page : 1,
      limit ? +limit : 10,
    );
  }

  // PATCH /incidents/admin/:id/status
  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard) // Ajouter AdminGuard
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: IncidentStatus,
    @Body('adminNote') adminNote?: string,
  ) {
    return this.incidentsService.updateStatus(id, status, adminNote);
  }
}
