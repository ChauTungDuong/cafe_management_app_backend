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
import { ResetPasswordDto, VerifyOtpDto } from './dto/forgot-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
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

  @Patch('change-password')
  changePassword(@Req() request, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(request.user.id, dto);
  }

  @Post('logout')
  async logout(@Req() request) {
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('Token not found');
    }
    return this.authService.logout(request.user.id, token);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Public()
  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.otp,
      resetPasswordDto.newPassword,
    );
  }
}
