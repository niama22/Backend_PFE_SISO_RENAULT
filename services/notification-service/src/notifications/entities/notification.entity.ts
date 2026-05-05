import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type NotificationChannel = 'IN_APP' | 'EMAIL';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  recipient!: string; // email or user id

  @Column({ type: 'varchar', default: 'IN_APP' })
  channel!: NotificationChannel;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ default: false })
  read!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
