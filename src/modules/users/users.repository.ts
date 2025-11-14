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

  async create(
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

  async findById(id: User['id']): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    return UserMapper.toDomain(user);
  }

  async findByEmail(email: User['email']): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    return UserMapper.toDomain(user);
  }

  async update(
    id: User['id'],
    updateData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }
    await this.usersRepository.save({
      ...user,
      ...updateData,
    });
    return UserMapper.toDomain(user);
  }

  async delete(id: User['id']): Promise<void> {
    await this.usersRepository.softRemove({ id });
  }

  async findByRefreshToken(refreshToken: string): Promise<User> {
    return await this.usersRepository.findOne({ where: { refreshToken } });
  }

  async updateRefreshToken(
    id: User['id'],
    refreshToken: string,
  ): Promise<void> {
    await this.usersRepository.update({ id }, { refreshToken });
  }
}
