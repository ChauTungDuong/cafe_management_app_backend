import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user-dto';
import { UpdateUserDto } from './dto/update-user-dto';
import * as bcrypt from 'bcrypt';
import { User } from './users.domain';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createUser(userData: CreateUserDto, avatar?: Express.Multer.File) {
    const existsUser = await this.usersRepository.findByEmail(userData.email);
    if (existsUser) {
      throw new Error('Email already in use');
    }

    // Handle avatar upload
    if (avatar) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        avatar,
        'users',
      );
      userData.avatar = uploadResult.secure_url;
      userData.avatarPublicId = uploadResult.public_id;
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

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    avatar?: Express.Multer.File,
  ) {
    const existsUser = await this.usersRepository.findById(id);
    if (!existsUser) {
      throw new Error('User not found');
    }

    // Handle avatar upload
    if (avatar) {
      // Delete old avatar if exists
      if (existsUser.avatarPublicId) {
        await this.cloudinaryService.deleteImage(existsUser.avatarPublicId);
      }

      // Upload new avatar
      const uploadResult = await this.cloudinaryService.uploadImage(
        avatar,
        'users',
      );
      updateUserDto.avatar = uploadResult.secure_url;
      updateUserDto.avatarPublicId = uploadResult.public_id;
    }

    await this.usersRepository.update(id, updateUserDto);
    return this.usersRepository.findById(id);
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
