import { Module } from '@nestjs/common';
import { ExercisesModule } from './exercises/exercises.module';
import { SkillsModule } from './skills/skills.module';

@Module({
  imports: [ExercisesModule, SkillsModule],
})
export class CatalogueModule {}
