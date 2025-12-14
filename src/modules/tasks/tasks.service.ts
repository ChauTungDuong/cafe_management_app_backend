import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StatisticService } from '../statistic/statistic.service';
import { InjectRepository } from '@nestjs/typeorm';
import { TaxAndDiscountEntity } from 'src/database/entity/tax-and-discount.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private statisticService: StatisticService,
    @InjectRepository(TaxAndDiscountEntity)
    private taxDiscountRepository: Repository<TaxAndDiscountEntity>,
  ) {}

  /**
   * Run daily statistics calculation at 00:05 AM every day (UTC+7)
   */
  @Cron('5 0 * * *', {
    name: 'daily-statistics',
    timeZone: 'Asia/Bangkok',
  })
  async handleDailyStatistics() {
    this.logger.log('Running daily statistics calculation...');

    try {
      // Calculate stats for yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await this.statisticService.calculateDailyStats(yesterday);

      // Also calculate monthly stats if it's the first day of the month
      const today = new Date();
      if (today.getDate() === 1) {
        const lastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1,
        );
        await this.statisticService.calculateMonthlyStats(
          lastMonth.getFullYear(),
          lastMonth.getMonth() + 1,
        );
        this.logger.log('Monthly statistics also calculated');
      }

      this.logger.log('Daily statistics calculation completed');
    } catch (error) {
      this.logger.error('Failed to calculate daily statistics', error.stack);
    }
  }

  /**
   * Update isActive status for taxes and discounts every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'update-tax-discount-status',
    timeZone: 'Asia/Bangkok',
  })
  async handleTaxDiscountStatusUpdate() {
    this.logger.log('Updating tax/discount isActive status...');

    try {
      const now = new Date();

      // Find all taxes/discounts
      const allTaxDiscounts = await this.taxDiscountRepository.find();

      let activatedCount = 0;
      let deactivatedCount = 0;

      for (const taxDiscount of allTaxDiscounts) {
        let shouldBeActive = taxDiscount.isActive;

        // Check if applyFrom has passed
        if (taxDiscount.applyFrom && taxDiscount.applyFrom > now) {
          shouldBeActive = false; // Not yet started
        }

        // Check if applyTo has passed
        if (taxDiscount.applyTo && taxDiscount.applyTo < now) {
          shouldBeActive = false; // Already ended
        }

        // Check if it's within the valid period
        if (
          (!taxDiscount.applyFrom || taxDiscount.applyFrom <= now) &&
          (!taxDiscount.applyTo || taxDiscount.applyTo >= now)
        ) {
          // Within valid period - check original isActive value from database
          // If it was manually set to inactive, keep it inactive
          // Only auto-activate if it was previously active
          if (taxDiscount.isActive) {
            shouldBeActive = true;
          }
        }

        // Update if status changed
        if (taxDiscount.isActive !== shouldBeActive) {
          await this.taxDiscountRepository.update(taxDiscount.id, {
            isActive: shouldBeActive,
          });

          if (shouldBeActive) {
            activatedCount++;
            this.logger.log(
              `Activated: ${taxDiscount.name} (${taxDiscount.type})`,
            );
          } else {
            deactivatedCount++;
            this.logger.log(
              `Deactivated: ${taxDiscount.name} (${taxDiscount.type})`,
            );
          }
        }
      }

      this.logger.log(
        `Tax/Discount status update completed: ${activatedCount} activated, ${deactivatedCount} deactivated`,
      );
    } catch (error) {
      this.logger.error('Failed to update tax/discount status', error.stack);
    }
  }

  /**
   * Manual trigger for daily stats (for testing or catch-up)
   */
  async triggerDailyStats(date?: Date) {
    const targetDate = date || new Date();
    targetDate.setDate(targetDate.getDate() - 1);

    this.logger.log(
      `Manually triggering stats for ${targetDate.toISOString()}`,
    );
    await this.statisticService.calculateDailyStats(targetDate);
  }

  /**
   * Manual trigger for monthly stats (for testing or catch-up)
   */
  async triggerMonthlyStats(year: number, month: number) {
    this.logger.log(`Manually triggering stats for ${year}-${month}`);
    await this.statisticService.calculateMonthlyStats(year, month);
  }
}
