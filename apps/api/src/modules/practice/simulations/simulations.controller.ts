import { Body, Controller, Post } from '@nestjs/common';
import { G1TurnDto } from './dto/g1-turn.dto';
import { G2PageDto } from './dto/g2-page.dto';
import { SimulationsService } from './simulations.service';

@Controller('simulations')
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Post('g1/turns')
  g1Turn(@Body() dto: G1TurnDto) {
    return this.simulationsService.g1Turn(dto);
  }

  @Post('g2/page')
  g2Submit(@Body() dto: G2PageDto) {
    return this.simulationsService.g2Submit(dto);
  }
}
