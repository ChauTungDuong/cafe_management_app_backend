import { Exclude } from 'class-transformer';
import { UserRole } from './dto/create-user-dto';

export class User {
  id: string;
  name: string;
  email: string;
  @Exclude({ toPlainOnly: true })
  password: string;
  role: UserRole;
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
