import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user-dto';
import { UpdateUserDto } from './dto/update-user-dto';
import * as bcrypt from 'bcrypt';
import { User } from './users.domain';
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(userData: CreateUserDto) {
    const existsUser = await this.usersRepository.findByEmail(userData.email);
    if (existsUser) {
      throw new Error('Email already in use');
    }
    return this.usersRepository.create(userData);
  }
  findAll() {
    return this.usersRepository.findAll();
  }

  findById(id: string) {
    return this.usersRepository.findById(id);
  }

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const existsUser = await this.usersRepository.findById(id);
    if (!existsUser) {
      throw new Error('User not found');
    }
    return this.usersRepository.update(id, updateUserDto);
  }
  async deleteUser(id: string) {
    const existsUser = await this.usersRepository.findById(id);
    if (!existsUser) {
      throw new Error('User not found');
    }
    return this.usersRepository.delete(id);
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const valid = await this.comparePassword(
      password,
      user.password ? user.password : '',
    );
    return valid ? user : null;
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    if (hashedPassword === '' || !hashedPassword) {
      throw new Error('Invalid hashed password');
    }
    return await bcrypt.compare(password, hashedPassword);
  }

  async updateUserRefreshToken(userId: string, refreshToken: string) {
    return await this.usersRepository.updateRefreshToken(userId, refreshToken);
  }

  async findUserByRefreshToken(refreshToken: string) {
    return await this.usersRepository.findByRefreshToken(refreshToken);
  }
}
