import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './entities/incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IncidentStatus } from './enums/incident-status.enum';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
  ) {}

  async create(driverId: string, dto: CreateIncidentDto): Promise<Incident> {
    const incident = this.incidentRepo.create({
      driverId,
      truckId: dto.truckId ?? null,
      type: dto.type,
      description: dto.description,
      attachments: dto.attachments || [],
      status: IncidentStatus.PENDING,
    });

    const saved = await this.incidentRepo.save(incident);
    this.logger.log(`New incident created: ${saved.id} by driver ${driverId}`);
    return saved;
  }

  async findByDriver(driverId: string): Promise<Incident[]> {
    return this.incidentRepo.find({
      where: { driverId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, driverId: string): Promise<Incident> {
    const incident = await this.incidentRepo.findOne({ where: { id } });
    if (!incident) throw new NotFoundException(`Incident with ID ${id} not found`);
    if (incident.driverId !== driverId) {
      throw new ForbiddenException('Access denied to this incident');
    }
    return incident;
  }

  async update(id: string, driverId: string, dto: UpdateIncidentDto): Promise<Incident> {
    const incident = await this.findOne(id, driverId);

    if (incident.status !== IncidentStatus.PENDING) {
      throw new ForbiddenException(
        'Cannot modify an incident that is already being processed',
      );
    }

    Object.assign(incident, {
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.truckId !== undefined && { truckId: dto.truckId }),
      ...(dto.attachments !== undefined && { attachments: dto.attachments }),
    });

    return this.incidentRepo.save(incident);
  }

  async cancel(id: string, driverId: string): Promise<Incident> {
    const incident = await this.findOne(id, driverId);
    if (incident.status !== IncidentStatus.PENDING) {
      throw new ForbiddenException(
        'Cannot cancel an incident that is already being processed',
      );
    }
    incident.status = IncidentStatus.REJECTED;
    return this.incidentRepo.save(incident);
  }

  async addAttachments(
    incidentId: string,
    driverId: string,
    fileUrls: string[],
  ): Promise<Incident> {
    const incident = await this.findOne(incidentId, driverId);
    if (incident.status !== IncidentStatus.PENDING) {
      throw new BadRequestException(
        'Cannot add attachments to an incident that is already being processed',
      );
    }

    const currentAttachments = incident.attachments || [];
    incident.attachments = [...currentAttachments, ...fileUrls];
    return this.incidentRepo.save(incident);
  }
}
