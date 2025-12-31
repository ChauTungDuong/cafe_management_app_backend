import { Controller, Get, Query } from '@nestjs/common';
import { Role } from 'src/modules/auth/roles.enum';
import { Roles } from 'src/modules/auth/roles.decorator';
import { GetLogsQueryDto } from './dto/get-logs.dto';
import { LogService } from './log.service';

@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  async getLogs(@Query() query: GetLogsQueryDto) {
    return this.logService.list(query);
  }
}
