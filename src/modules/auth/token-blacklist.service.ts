import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { TokenBlacklistEntity } from 'src/database/entity/token-blacklist.entity';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TokenBlacklistService {
  constructor(
    @InjectRepository(TokenBlacklistEntity)
    private tokenBlacklistRepository: Repository<TokenBlacklistEntity>,
    private jwtService: JwtService,
  ) {}

  async addToken(token: string, userId?: string): Promise<void> {
    if (!token) return;

    // Trim token để tránh lỗi khoảng trắng
    const trimmedToken = token.trim();

    try {
      // Decode token để lấy expiration time
      const decoded = this.jwtService.decode(trimmedToken) as any;
      const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24h

      // Kiểm tra token đã tồn tại chưa
      const existing = await this.tokenBlacklistRepository.findOne({
        where: { token: trimmedToken },
      });

      if (!existing) {
        const saved = await this.tokenBlacklistRepository.save({
          token: trimmedToken,
          expiresAt,
          userId,
        });
      } else {
        throw new BadRequestException('Token has already been blacklisted');
      }
    } catch (error) {
      await this.tokenBlacklistRepository.save({
        token: trimmedToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        userId,
      });
    }
  }

  async isBlacklisted(token: string): Promise<boolean> {
    if (!token) return false;

    // Trim token để tránh lỗi khoảng trắng
    const trimmedToken = token.trim();

    const found = await this.tokenBlacklistRepository.findOne({
      where: { token: trimmedToken },
    });
    return !!found;
  }

  async removeToken(token: string): Promise<void> {
    await this.tokenBlacklistRepository.delete({ token });
  }

  // Cleanup expired tokens every day at 3 AM
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    const result = await this.tokenBlacklistRepository.delete({
      expiresAt: LessThan(now),
    });
    console.log(
      `Cleaned up ${result.affected || 0} expired tokens from blacklist`,
    );
  }

  // Manual cleanup method
  async clearExpired(): Promise<number> {
    const now = new Date();
    const result = await this.tokenBlacklistRepository.delete({
      expiresAt: LessThan(now),
    });
    return result.affected || 0;
  }

  // Clear all (for testing only)
  async clearAll(): Promise<void> {
    await this.tokenBlacklistRepository.clear();
  }
}
