import {
  Controller,
  Param,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Get,
  Header,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local.guard';
import { JwtAuthGuard } from './guards/auth.guard';
import { Response } from 'express';
import { Request } from 'express';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public, Roles } from './roles.decorator';
import { UpdateUserDto } from '../users/dto/update-user-dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseFormDataJsonInterceptor } from 'src/utils/parse-form-data.interceptor';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Public()
  @Post('login')
  login(@Req() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.RenewToken(refreshTokenDto.refreshToken);
  }

  @Get('/profile')
  getProfile(@Req() request) {
    return this.authService.getProfile(request);
  }

  @Patch('/profile')
  @UseInterceptors(
    FileInterceptor('avatar'),
    new ParseFormDataJsonInterceptor(),
  )
  updateProfile(
    @Req() request,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    return this.authService.updateProfile(request, updateUserDto, avatar);
  }
}
