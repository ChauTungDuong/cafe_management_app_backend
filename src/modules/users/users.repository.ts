import { UsersEntity } from 'src/database/entity/users.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user-dto';
import { User } from './users.domain';
import { UserMapper } from './user.mapper';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UsersEntity)
    private usersRepository: Repository<UsersEntity>,
  ) {}

  async createUser(
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    const user = await UserMapper.toEntity(userData as User);
    const newUser = await this.usersRepository.save(
      this.usersRepository.create(user),
    );
    return UserMapper.toDomain(newUser);
  }

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find();
    return users.map((user) => UserMapper.toDomain(user));
  }
}
