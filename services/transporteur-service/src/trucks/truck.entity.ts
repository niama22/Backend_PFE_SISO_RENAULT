import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Driver } from '../drivers/driver.entity';
import { Incident } from '../incidents/entities/incident.entity';

@Entity('trucks')
export class Truck {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  plateNumber!: string;

  @Column()
  model!: string;

  @Column({ nullable: true })
  status!: string | null;

  @Column({ nullable: true })
  driverId!: string | null;

  @ManyToOne(() => Driver, (driver) => driver.trucks, { nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver!: Driver | null;

  @OneToMany(() => Incident, (incident) => incident.truck)
  incidents!: Incident[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
