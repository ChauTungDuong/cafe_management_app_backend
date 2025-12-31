import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/users.domain';
import { AuthPayload } from './interfaces/auth.interface';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as ms from 'ms-extended';
import { access } from 'fs';
import { UpdateUserDto } from '../users/dto/update-user-dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MailService } from './mail.service';
import { TokenBlacklistService } from './token-blacklist.service';
import * as bcrypt from 'bcrypt';
import { LogService } from '../log/log.service';
import { Action } from 'src/database/entity/log.entity';
@Injectable()
export class AuthService {
  private otpStore = new Map<string, { otp: string; expiresAt: number }>();

  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
    private mailService: MailService,
    private tokenBlacklistService: TokenBlacklistService,
    private logService: LogService,
  ) {}
  async login(user: User) {
    if (!user.isActive) {
      throw new BadRequestException('Tài khoản đã bị vô hiệu hóa');
    }
    const payload: AuthPayload = {
      sub: user.id,
      iss: 'server',
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const newRefreshToken = await this.createAndUpdateRefreshToken(
      payload,
      user.id,
    );
    return {
      access_token: this.createToken(payload, 'JWT'),
      refresh_token: newRefreshToken,
      user: user,
    };
  }

  async RenewToken(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('No refresh token provided');
    }
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
      role: user.role,
    };
    const newRefreshToken = await this.createAndUpdateRefreshToken(
      newPayload,
      user.id,
    );

    return {
      access_token: this.createToken(newPayload, 'JWT'),
      refresh_token: newRefreshToken,
      user: user,
    };
  }

  createToken(payload: any, secretType: string) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get(`jwt.${secretType}_SECRET`),
      expiresIn: this.configService.get(`jwt.${secretType}_EXPIRES_IN`),
    });
  }

  async createAndUpdateRefreshToken(newPayload: any, userId: string) {
    const newRefreshToken = this.createToken(newPayload, 'JWT_REFRESH');
    await this.userService.updateUserRefreshToken(userId, newRefreshToken);
    return newRefreshToken;
  }

  async getProfile(request): Promise<User> {
    const user = await this.userService.findById(request.user.id);
    return user;
  }

  async updateProfile(
    request,
    updateUserDto: UpdateUserDto,
    avatar?: Express.Multer.File,
  ) {
    const user = await this.userService.findById(request.user.id);

    if (avatar) {
      if (user.avatarPublicId) {
        await this.cloudinaryService.deleteImage(user.avatarPublicId);
      }

      const uploadResult = await this.cloudinaryService.uploadImage(
        avatar,
        'users',
      );
      updateUserDto.avatar = uploadResult.secure_url;
      updateUserDto.avatarPublicId = uploadResult.public_id;
    }

    const updatedUser = await this.userService.updateUser(
      request.user.id,
      updateUserDto,
    );
    return updatedUser;
  }

  async logout(userId: string, accessToken: string) {
    if (accessToken) {
      await this.tokenBlacklistService.addToken(accessToken, userId);
    } else {
      throw new BadRequestException('No access token provided for logout');
    }

    await this.userService.updateUserRefreshToken(userId, null);

    return {
      success: true,
      message: 'Đăng xuất thành công',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    this.otpStore.set(email, { otp, expiresAt });

    await this.mailService.sendOtpEmail(email, otp);

    return {
      success: true,
      message: 'Mã OTP đã được gửi đến email của bạn',
      expiresIn: '5 phút',
    };
  }

  async verifyOtp(email: string, otp: string) {
    const storedData = this.otpStore.get(email);

    if (!storedData) {
      throw new BadRequestException('OTP không tồn tại hoặc đã hết hạn');
    }

    if (Date.now() > storedData.expiresAt) {
      this.otpStore.delete(email);
      throw new BadRequestException('OTP đã hết hạn');
    }

    if (storedData.otp !== otp) {
      throw new BadRequestException('OTP không chính xác');
    }

    return {
      success: true,
      message: 'Xác thực OTP thành công',
    };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    await this.verifyOtp(email, otp);
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User không tồn tại');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userService.updateUser(user.id, { password: hashedPassword });
    this.otpStore.delete(email);
    await this.userService.updateUserRefreshToken(user.id, null);

    // Audit log: password reset/change succeeded
    await this.logService.write({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: Action.UPDATE,
      entityType: 'user',
      entityId: user.id,
      entityName: user.email,
      message: `${user.name ?? user.email ?? user.id} đổi mật khẩu thành công`,
      metadata: {
        scope: 'auth',
        type: 'reset-password',
      },
    });

    return {
      success: true,
      message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
    };
  }
}
