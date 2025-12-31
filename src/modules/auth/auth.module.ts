import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalStrategy } from './strategy/local.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtRefreshStrategy } from './strategy/jwt.refresh.strategy';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { MailService } from './mail.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { TokenBlacklistEntity } from 'src/database/entity/token-blacklist.entity';
import { LogModule } from '../log/log.module';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([TokenBlacklistEntity]),
    CloudinaryModule,
    LogModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MailService,
    TokenBlacklistService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [AuthService, TokenBlacklistService],
})
export class AuthModule {}
