import { Exclude } from 'class-transformer';
import { Role } from '../auth/roles.enum';

export class User {
  id: string;
  name: string;
  email: string;
  @Exclude({ toPlainOnly: true })
  password: string;
  role: Role;
  phone?: string;
  address?: string;
  avatar?: string;
  gender?: string;
  birthday?: Date;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
