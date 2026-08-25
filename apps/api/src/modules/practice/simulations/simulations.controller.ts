import { Body, Controller, Post } from '@nestjs/common';
import { G1TurnDto } from './dto/g1-turn.dto';
import { SimulationsService } from './simulations.service';

@Controller('simulations')
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Post('g1/turns')
  g1Turn(@Body() dto: G1TurnDto) {
    return this.simulationsService.g1Turn(dto);
  }

  @Post('g2/page')
  g2Submit(@Body() payload: unknown) {
    return this.simulationsService.g2Submit(payload);
  }
}
