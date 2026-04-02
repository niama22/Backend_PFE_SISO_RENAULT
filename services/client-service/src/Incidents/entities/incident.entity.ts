// entities/incident.entity.ts
import { Entity, PrimaryGeneratedColumn, Column,
         CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IncidentType }   from '../enums/incident-type.enum';
import { IncidentStatus } from '../enums/incident-status.enum';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;           // ID du client qui signale

  @Column({ nullable: true })
  orderId: string;            // Commande concernée (optionnel)

  @Column({ nullable: true })
  deliveryId: string;         // Livraison concernée (optionnel)

  @Column({ type: 'enum', enum: IncidentType })
  type: IncidentType;

  @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.PENDING })
  status: IncidentStatus;

  @Column({ type: 'text' })
  description: string;        // Description détaillée

  @Column({ type: 'simple-array', nullable: true })
  attachments: string[];      // URLs des photos/preuves

  @Column({ type: 'text', nullable: true })
  adminNote: string;          // Note de l'admin lors de la résolution

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date;
}