import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/auth.guard';
import { RoleGuard } from './modules/auth/guards/roles.guard';
import { ItemModule } from './modules/item/item.module';
import { OrderModule } from './modules/order/order.module';
import { CategoryModule } from './modules/category/category.module';
import { TaxModule } from './modules/tax/tax.module';
import { TableModule } from './modules/table/table.module';
import { PaymentModule } from './modules/payment/payment.module';
import cloudinaryConfig from './config/cloudinary.config';
import { RecipeModule } from './modules/recipe/recipe.module';
import { IngredientModule } from './modules/ingredient/ingredient.module';
import { ScheduleModule } from '@nestjs/schedule';
import { StatisticModule } from './modules/statistic/statistic.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { LogModule } from './modules/log/log.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActivityLogInterceptor } from './modules/log/activity-log.interceptor';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig, jwtConfig, cloudinaryConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath:
        process.env.NODE_ENV === 'production'
          ? join(__dirname, '..', 'public') // dist/public when built
          : join(process.cwd(), 'src', 'public'), // src/public during dev
      serveRoot: '/public',
    }),
    UsersModule,
    AuthModule,
    ItemModule,
    OrderModule,
    CategoryModule,
    TaxModule,
    TableModule,
    PaymentModule,
    IngredientModule,
    RecipeModule,
    StatisticModule,
    TasksModule,
    LogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_GUARD',
      useClass: JwtAuthGuard,
    },
    {
      provide: 'APP_GUARD',
      useClass: RoleGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLogInterceptor,
    },
  ],
})
export class AppModule {}
