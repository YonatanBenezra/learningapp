import { Module } from '@nestjs/common';
import { AttemptsModule } from './attempts/attempts.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { RunsModule } from './runs/runs.module';
import { GradesModule } from './grades/grades.module';
import { TracesModule } from './traces/traces.module';
import { HintsModule } from './hints/hints.module';
import { SimulationsModule } from './simulations/simulations.module';

@Module({
  imports: [
    AttemptsModule,
    SubmissionsModule,
    RunsModule,
    GradesModule,
    TracesModule,
    HintsModule,
    SimulationsModule,
  ],
})
export class PracticeModule {}
