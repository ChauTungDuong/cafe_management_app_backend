import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user-dto';
import { UpdateUserDto } from './dto/update-user-dto';
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
}
