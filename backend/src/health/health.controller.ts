import { Controller, Get } from '@nestjs/common';

/**
 * Dependency-free liveness probe. Intentionally does not touch the database so
 * it reports whether the process is up, independent of downstream health.
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok'; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
