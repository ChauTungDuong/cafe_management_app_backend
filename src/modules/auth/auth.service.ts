import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/users.domain';
import { AuthPayload } from './interfaces/auth.interface';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as ms from 'ms-extended';
import { access } from 'fs';
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
    private configService: ConfigService,
  ) {}
  async login(user: User, response: Response) {
    if (!user.isActive) {
      throw new BadRequestException('Tài khoản đã bị vô hiệu hóa');
    }
    const payload: AuthPayload = {
      sub: user.id,
      iss: 'server',
      email: user.email,
      name: user.name,
    };

    await this.createAndUpdateRefreshToken(payload, response, user.id);
    // Secret và expiresIn đã được cấu hình trong AuthModule
    return {
      access_token: this.createToken(payload, 'JWT'),
      user: user,
    };
  }

  async RenewToken(refreshToken: string, response: Response) {
    const payload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get('jwt.JWT_REFRESH_SECRET'),
    });
    const user = await this.userService.findUserByRefreshToken(refreshToken);
    if (!user || user.id !== payload.sub) {
      throw new BadRequestException('Invalid refresh token');
    }
    const newPayload: AuthPayload = {
      sub: user.id,
      iss: 'server',
      name: user.name,
      email: user.email,
    };
    response.clearCookie('refreshToken');
    await this.createAndUpdateRefreshToken(newPayload, response, user.id);

    return {
      access_token: this.createToken(newPayload, 'JWT'),
      user: user,
    };
  }

  createToken(payload: any, secretType: string) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get(`jwt.${secretType}_SECRET`),
      expiresIn: this.configService.get(`jwt.${secretType}_EXPIRES_IN`),
    });
  }

  async createAndUpdateRefreshToken(
    newPayload: any,
    response: Response,
    userId: string,
  ) {
    const newRefreshToken = this.createToken(newPayload, 'JWT_REFRESH');
    await this.userService.updateUserRefreshToken(userId, newRefreshToken);
    response.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      maxAge:
        ms.sec(this.configService.get('jwt.JWT_REFRESH_EXPIRES_IN')) * 1000,
    });
  }
}
