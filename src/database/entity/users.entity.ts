import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';

import { OrderEntity } from './order.entity';
import { Role } from 'src/modules/auth/roles.enum';
@Entity('users')
export class UsersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ nullable: false })
  name: string;

  @Column({ default: 'male' })
  gender: string;

  @Column()
  birthday: Date;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column({ nullable: true, default: '/public/defaults/default-avatar.png' })
  avatar: string;

  @Column({ nullable: true })
  avatarPublicId: string;

  @Column({ default: Role.STAFF })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  refreshToken: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => OrderEntity, (order) => order.createdBy)
  orders: OrderEntity[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Only hash when password is plaintext.
    // If password already looks like a bcrypt hash, do not hash again.
    if (this.password && !/^\$2[aby]\$/.test(this.password)) {
      const salt = bcrypt.genSaltSync(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
}
