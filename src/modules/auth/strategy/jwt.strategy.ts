import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthPayload } from '../interfaces/auth.interface';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { TokenBlacklistService } from '../token-blacklist.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService<AllConfigType>,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    const jwtConfig = configService.get('jwt', { infer: true });
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig?.JWT_SECRET,
      passReqToCallback: true, // Để lấy request object
    });
  }

  async validate(req: Request, payload: AuthPayload) {
    // Lấy token từ header
    const token = req.headers.authorization?.replace('Bearer ', '');

    // Kiểm tra token có trong blacklist không
    if (token && (await this.tokenBlacklistService.isBlacklisted(token))) {
      throw new UnauthorizedException(
        'Token has been blacklisted, please login again',
      );
    }

    return {
      id: payload.sub,
      iss: payload.iss,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  }
}
