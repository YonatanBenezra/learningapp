import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', service: 'labpath-api' };
  }

  @Get('ready')
  ready() {
    return { status: 'ok', service: 'labpath-api' };
  }
}
