import {
  Controller,
  Param,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local.guard';
import { JwtAuthGuard } from './guards/auth.guard';
import { Response } from 'express';
import { Request } from 'express';
import { RefreshTokenDto } from './dto/refresh-token.dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() req) {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.RenewToken(refreshTokenDto.refreshToken);
  }
}
