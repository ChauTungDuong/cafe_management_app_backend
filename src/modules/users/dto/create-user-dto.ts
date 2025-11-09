import {
  IsBoolean,
  IsDate,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Transform } from 'class-transformer';

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
}
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  email: string;

  @MinLength(3)
  @MaxLength(100)
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsEnum(['male', 'female'])
  gender: string;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => {
    if (!value) return undefined;

    // Handle MM/DD/YYYY format
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = value.match(dateRegex);

    if (match) {
      const [, month, day, year] = match;
      // Create date with month-1 because JavaScript months are 0-indexed
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      // Validate the date is actually valid
      if (
        date.getFullYear() == year &&
        date.getMonth() == month - 1 &&
        date.getDate() == day
      ) {
        return date;
      }
    }

    // Fallback: try to parse as standard date
    const fallbackDate = new Date(value);
    if (isNaN(fallbackDate.getTime())) {
      throw new Error(
        'Invalid date format. Expected MM/DD/YYYY or valid date string',
      );
    }

    return fallbackDate;
  })
  birthday?: Date;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive: boolean;
}
