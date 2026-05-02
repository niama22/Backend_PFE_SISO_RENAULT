import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentType } from '../enums/incident-type.enum';
import { Driver } from '../../drivers/driver.entity';
import { Truck } from '../../trucks/truck.entity';

@Entity('transporteur_incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  driverId!: string;

  @ManyToOne(() => Driver, (driver) => driver.incidents, { nullable: false })
  @JoinColumn({ name: 'driverId' })
  driver!: Driver;

  @Column({ nullable: true })
  truckId!: string | null;

  @ManyToOne(() => Truck, (truck) => truck.incidents, { nullable: true })
  @JoinColumn({ name: 'truckId' })
  truck!: Truck | null;

  @Column({ type: 'enum', enum: IncidentType })
  type!: IncidentType;

  @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.PENDING })
  status!: IncidentStatus;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'simple-array', nullable: true })
  attachments!: string[] | null;

  @Column({ type: 'text', nullable: true })
  adminNote!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
