import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Driver } from '../drivers/driver.entity';

@Entity('trucks')
export class Truck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  matricule: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ nullable: true })
  order: string;

  @Column({ nullable: true })
  location: string;

  @ManyToOne(() => Driver, (driver) => driver.trucks, {
    eager: true,
    nullable: false,
  })
  driver: Driver;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
