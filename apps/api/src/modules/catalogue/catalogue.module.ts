import { Module } from '@nestjs/common';
import { ExercisesModule } from './exercises/exercises.module';
import { PathsModule } from './paths/paths.module';
import { SkillsModule } from './skills/skills.module';

@Module({
  imports: [ExercisesModule, SkillsModule, PathsModule],
})
export class CatalogueModule {}
