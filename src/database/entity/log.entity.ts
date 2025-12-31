import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from 'src/modules/auth/roles.enum';

export enum Action {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ERROR = 'ERROR',
}

@Entity('log')
export class LogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  userName?: string;

  @Column({ type: 'enum', enum: Role, nullable: true })
  userRole?: Role;

  @Column({ type: 'enum', enum: Action })
  action: Action;

  @Column()
  entityType: string;

  @Column({ nullable: true })
  entityId?: string;

  @Column({ nullable: true })
  entityName?: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
