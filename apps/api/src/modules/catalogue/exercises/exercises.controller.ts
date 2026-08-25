import { Controller, Get, Param, Query } from '@nestjs/common';
import { PaginationQuery } from '../../../common/dto/pagination.query';
import { ExercisesService } from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  list(@Query() query: PaginationQuery) {
    return this.exercisesService.list(query);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.exercisesService.getBySlug(slug);
  }
}
