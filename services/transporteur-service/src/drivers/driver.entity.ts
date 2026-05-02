import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Truck } from '../trucks/truck.entity';
import { Incident } from '../incidents/entities/incident.entity';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  fullName!: string;

  @Column({ nullable: true })
  phone!: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => Truck, (truck) => truck.driver)
  trucks!: Truck[];

  @OneToMany(() => Incident, (incident) => incident.driver)
  incidents!: Incident[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
