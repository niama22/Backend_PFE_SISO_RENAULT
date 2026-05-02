import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IncidentsService } from './incidents.service';

const FILE_UPLOAD_CONFIG = {
  maxFiles: 5,
  maxFileSize: 5 * 1024 * 1024,
  allowedFormats: /jpeg|jpg|png|pdf/,
  destination: './uploads/incidents',
} as const;

@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req, @Body() dto: CreateIncidentDto) {
    return this.incidentsService.create(req.user.id, dto);
  }

  @Post(':id/attachments')
  @UseInterceptors(
    FilesInterceptor('files', FILE_UPLOAD_CONFIG.maxFiles, {
      storage: diskStorage({
        destination: FILE_UPLOAD_CONFIG.destination,
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `incident-${uniqueSuffix}${extname(file.originalname)}`);
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
  uploadAttachments(
    @Param('id') id: string,
    @Req() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) throw new BadRequestException('No files provided');
    const urls = files.map((file) => `/uploads/incidents/${file.filename}`);
    return this.incidentsService.addAttachments(id, req.user.id, urls);
  }

  @Get()
  findAll(@Req() req) {
    return this.incidentsService.findByDriver(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.incidentsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req, @Body() dto: UpdateIncidentDto) {
    return this.incidentsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @Req() req) {
    return this.incidentsService.cancel(id, req.user.id);
  }
}
