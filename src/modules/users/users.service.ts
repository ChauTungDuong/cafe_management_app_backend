import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user-dto';
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  createUser(userData: CreateUserDto) {
    return this.usersRepository.createUser(userData);
  }
  findAll() {
    return this.usersRepository.findAll();
  }
}
