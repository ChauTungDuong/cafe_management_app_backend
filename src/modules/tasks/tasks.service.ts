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
   * Auto-generate weekly report every Monday at 00:01 AM (UTC+7)
   * Generates report for the previous week (Monday to Sunday)
   */
  @Cron('1 0 * * 1', {
    name: 'weekly-statistics',
    timeZone: 'Asia/Bangkok',
  })
  async handleWeeklyStatistics() {
    this.logger.log('Running weekly statistics auto-generation...');

    try {
      const result = await this.statisticService.autoGenerateWeeklyReport();
      this.logger.log(`Weekly report: ${result.message}`);
    } catch (error) {
      this.logger.error('Failed to generate weekly statistics', error.stack);
    }
  }

  /**
   * Auto-generate monthly report on the 1st day of each month at 00:01 AM (UTC+7)
   * Generates report for the previous complete month
   */
  @Cron('1 0 1 * *', {
    name: 'monthly-statistics',
    timeZone: 'Asia/Bangkok',
  })
  async handleMonthlyStatistics() {
    this.logger.log('Running monthly statistics auto-generation...');

    try {
      const result = await this.statisticService.autoGenerateMonthlyReport();
      this.logger.log(`Monthly report: ${result.message}`);
    } catch (error) {
      this.logger.error('Failed to generate monthly statistics', error.stack);
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
}
