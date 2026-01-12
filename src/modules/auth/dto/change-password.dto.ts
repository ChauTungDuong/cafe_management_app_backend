import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { PASSWORD_REGEX } from 'src/utils/constant';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, {
    message:
      'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@#$%^&+=!*)',
  })
  newPassword: string;

  // Optional confirmation field (frontend may send it). We'll validate equality in service.
  @IsString()
  confirmPassword?: string;
}
