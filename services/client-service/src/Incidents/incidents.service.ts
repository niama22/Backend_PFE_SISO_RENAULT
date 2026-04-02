// incidents.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException,
  Logger 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './entities/incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { IncidentStatus } from './enums/incident-status.enum';
import { IncidentType } from './enums/incident-type.enum';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
  ) {}

  // ✅ Client signale un incident
  async create(clientId: string, dto: CreateIncidentDto): Promise<Incident> {
    const incident = this.incidentRepo.create({
      clientId,
      type: dto.type,
      description: dto.description,
      orderId: dto.orderId,
      deliveryId: dto.deliveryId,
      attachments: dto.attachments || [],
      status: IncidentStatus.PENDING,
    });

    const saved = await this.incidentRepo.save(incident);
    
    this.logger.log(`New incident created: ${saved.id} by client ${clientId}`);
    
    // 🔔 Notifier l'admin
    await this.notifyAdmin(saved);

    return saved;
  }

  // ✅ Ajouter des attachments
  async addAttachments(
    incidentId: string,
    clientId: string,
    fileUrls: string[],
  ): Promise<Incident> {
    const incident = await this.findOne(incidentId, clientId);

    if (incident.status !== IncidentStatus.PENDING) {
      throw new BadRequestException(
        'Cannot add attachments to an incident that is already being processed'
      );
    }

    const currentAttachments = incident.attachments || [];
    incident.attachments = [...currentAttachments, ...fileUrls];

    const saved = await this.incidentRepo.save(incident);
    
    this.logger.debug(`Added ${fileUrls.length} attachments to incident ${incidentId}`);
    
    return saved;
  }

  // ✅ Supprimer un attachment
  async removeAttachment(
    incidentId: string,
    clientId: string,
    attachmentUrl: string,
  ): Promise<Incident> {
    const incident = await this.findOne(incidentId, clientId);

    if (incident.status !== IncidentStatus.PENDING) {
      throw new BadRequestException(
        'Cannot remove attachments from an incident that is already being processed'
      );
    }

    const initialLength = incident.attachments?.length || 0;
    incident.attachments = (incident.attachments || []).filter(
      url => url !== attachmentUrl
    );

    if (incident.attachments.length === initialLength) {
      throw new NotFoundException('Attachment not found');
    }

    // Supprimer le fichier physique - CORRECTION ICI
    try {
      // Extraire le nom du fichier de l'URL
      const urlParts = attachmentUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      // Vérifier que filename n'est pas undefined
      if (filename && filename !== '') {
        const filePath = path.join(process.cwd(), 'uploads', 'incidents', filename);
        
        // Vérifier si le fichier existe avant de le supprimer
        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
          this.logger.debug(`Deleted file: ${filePath}`);
        } catch (error) {
          this.logger.warn(`File not found or already deleted: ${filePath}`);
        }
      } else {
        this.logger.warn(`Invalid attachment URL format: ${attachmentUrl}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete file for URL: ${attachmentUrl}`, error);
    }

    return this.incidentRepo.save(incident);
  }

  // 📋 Client consulte SES incidents
  async findByClient(clientId: string): Promise<Incident[]> {
    return this.incidentRepo.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  // 🔍 Détail d'un incident (avec vérification ownership)
  async findOne(id: string, clientId: string): Promise<Incident> {
    const incident = await this.incidentRepo.findOne({ where: { id } });

    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }
    
    if (incident.clientId !== clientId) {
      throw new ForbiddenException('Access denied to this incident');
    }

    return incident;
  }

  // ✅ Client modifie un incident (seulement si PENDING)
  async update(
    id: string,
    clientId: string,
    dto: UpdateIncidentDto,
  ): Promise<Incident> {
    const incident = await this.findOne(id, clientId);

    // Vérifier que l'incident peut être modifié
    if (incident.status !== IncidentStatus.PENDING) {
      throw new ForbiddenException(
        'Cannot modify an incident that is already being processed'
      );
    }

    // Seuls certains champs peuvent être modifiés par le client
    const allowedUpdates: Partial<UpdateIncidentDto> = {};
    
    if (dto.type !== undefined) allowedUpdates.type = dto.type;
    if (dto.description !== undefined) allowedUpdates.description = dto.description;
    if (dto.orderId !== undefined) allowedUpdates.orderId = dto.orderId;
    if (dto.deliveryId !== undefined) allowedUpdates.deliveryId = dto.deliveryId;
    if (dto.attachments !== undefined) allowedUpdates.attachments = dto.attachments;

    // Appliquer les modifications
    Object.assign(incident, allowedUpdates);
    
    const updated = await this.incidentRepo.save(incident);
    
    this.logger.debug(`Incident ${id} updated by client ${clientId}`);
    
    return updated;
  }

  // ❌ Client annule un incident (seulement si PENDING)
  async cancel(id: string, clientId: string): Promise<Incident> {
    const incident = await this.findOne(id, clientId);

    if (incident.status !== IncidentStatus.PENDING) {
      throw new ForbiddenException(
        'Cannot cancel an incident that is already being processed'
      );
    }

    incident.status = IncidentStatus.REJECTED;
    
    const cancelled = await this.incidentRepo.save(incident);
    
    this.logger.log(`Incident ${id} cancelled by client ${clientId}`);
    
    // Nettoyer les fichiers
    await this.cleanupAttachments(cancelled.attachments || []);
    
    return cancelled;
  }

  // 👑 Admin: Récupérer tous les incidents avec filtres
  async findAllForAdmin(
    status?: IncidentStatus,
    type?: IncidentType,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ incidents: Incident[]; total: number }> {
    const queryBuilder = this.incidentRepo.createQueryBuilder('incident');

    if (status) {
      queryBuilder.andWhere('incident.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('incident.type = :type', { type });
    }

    const [incidents, total] = await queryBuilder
      .orderBy('incident.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { incidents, total };
  }

  // 👑 Admin: Mettre à jour le statut d'un incident
  async updateStatus(
    id: string,
    status: IncidentStatus,
    adminNote?: string,
  ): Promise<Incident> {
    const incident = await this.incidentRepo.findOne({ where: { id } });

    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }

    // Valider la transition de statut
    this.validateStatusTransition(incident.status, status);

    incident.status = status;
    
    if (adminNote) {
      incident.adminNote = adminNote;
    }

    if (status === IncidentStatus.RESOLVED) {
      incident.resolvedAt = new Date();
    }

    const updated = await this.incidentRepo.save(incident);
    
    this.logger.log(`Incident ${id} status updated to ${status} by admin`);
    
    // Notifier le client du changement de statut
    await this.notifyClient(updated);
    
    return updated;
  }

  // 📊 Statistiques pour un client
  async getClientStats(clientId: string): Promise<{
    total: number;
    byStatus: Record<IncidentStatus, number>;
    byType: Record<IncidentType, number>;
    recent: Incident[];
  }> {
    const incidents = await this.findByClient(clientId);
    
    const byStatus = incidents.reduce((acc, incident) => {
      acc[incident.status] = (acc[incident.status] || 0) + 1;
      return acc;
    }, {} as Record<IncidentStatus, number>);

    const byType = incidents.reduce((acc, incident) => {
      acc[incident.type] = (acc[incident.type] || 0) + 1;
      return acc;
    }, {} as Record<IncidentType, number>);

    return {
      total: incidents.length,
      byStatus,
      byType,
      recent: incidents.slice(0, 5),
    };
  }

  // 🔔 Notification admin
  private async notifyAdmin(incident: Incident): Promise<void> {
    this.logger.log(`[ALERT] New ${incident.type} incident from client ${incident.clientId}`);
    
    // À connecter avec votre système de notification
    // await this.emailService.sendAdminNotification({
    //   subject: `New Incident: ${incident.type}`,
    //   incidentId: incident.id,
    //   description: incident.description,
    // });
  }

  // 🔔 Notifier le client
  private async notifyClient(incident: Incident): Promise<void> {
    this.logger.log(`[NOTIFICATION] Incident ${incident.id} status: ${incident.status}`);
    
    // À connecter avec votre système de notification
    // await this.notificationService.notifyClient(incident.clientId, {
    //   incidentId: incident.id,
    //   status: incident.status,
    //   message: `Your incident has been ${incident.status.toLowerCase()}`,
    // });
  }

  // 🧹 Nettoyer les fichiers d'attachment - CORRECTION ICI AUSSI
  private async cleanupAttachments(attachments: string[]): Promise<void> {
    for (const attachment of attachments) {
      try {
        // Extraire le nom du fichier de l'URL
        const urlParts = attachment.split('/');
        const filename = urlParts[urlParts.length - 1];
        
        // Vérifier que filename est valide
        if (filename && filename !== '') {
          const filePath = path.join(process.cwd(), 'uploads', 'incidents', filename);
          
          try {
            await fs.access(filePath);
            await fs.unlink(filePath);
            this.logger.debug(`Cleaned up file: ${filePath}`);
          } catch (error) {
            this.logger.warn(`File not found during cleanup: ${filePath}`);
          }
        } else {
          this.logger.warn(`Invalid attachment URL during cleanup: ${attachment}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to delete attachment: ${attachment}`, error);
      }
    }
  }

  // ✅ Valider les transitions de statut
  private validateStatusTransition(
    currentStatus: IncidentStatus,
    newStatus: IncidentStatus,
  ): void {
    // Définir les transitions valides
    const validTransitions: Record<IncidentStatus, IncidentStatus[]> = {
      [IncidentStatus.PENDING]: [IncidentStatus.REVIEWING, IncidentStatus.REJECTED],
      [IncidentStatus.REVIEWING]: [IncidentStatus.RESOLVED, IncidentStatus.REJECTED],
      [IncidentStatus.RESOLVED]: [],
      [IncidentStatus.REJECTED]: [],
    };

    const allowed = validTransitions[currentStatus];
    
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`
      );
    }
  }
}