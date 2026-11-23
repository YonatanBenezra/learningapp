import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import {
  RateLimit,
  UserRateLimitGuard,
} from '../../../common/guards/user-rate-limit.guard';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { G1TurnDto } from './dto/g1-turn.dto';
import { G2PageDto } from './dto/g2-page.dto';
import { G3ProbeDto } from './dto/g3-probe.dto';
import { SimulationsService } from './simulations.service';

const MINUTE = 60_000;

/**
 * Live practice against the guardrails simulators. Not graded; limited per
 * learner so the lab cannot stand in for unlimited grading.
 */
@Controller('simulations')
@UseGuards(UserRateLimitGuard)
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Post('g1/turns')
  @RateLimit({ bucket: 'guard-sim-g1', max: 60, windowMs: MINUTE })
  g1Turn(@CurrentUser() _user: AuthenticatedUser, @Body() dto: G1TurnDto) {
    return this.simulationsService.g1Turn(dto);
  }

  @Post('g2/page')
  @RateLimit({ bucket: 'guard-sim-g2', max: 60, windowMs: MINUTE })
  g2Submit(@CurrentUser() _user: AuthenticatedUser, @Body() dto: G2PageDto) {
    return this.simulationsService.g2Submit(dto);
  }

  /** One message through a G3 stack; the classifier makes this the costliest. */
  @Post('g3/probe')
  @RateLimit({ bucket: 'guard-sim-g3', max: 30, windowMs: MINUTE })
  g3Probe(@CurrentUser() _user: AuthenticatedUser, @Body() dto: G3ProbeDto) {
    return this.simulationsService.g3Probe(dto);
  }
}
