import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';

import { ProcessResumeSchema } from './index.schema';
import { ResumesService } from './index.service';

@Controller('resumes')
export class ResumesController {
  constructor(private readonly service: ResumesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  processResume(@Body() body: unknown) {
    const parsed = ProcessResumeSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException(
        'Dados do currículo inválidos',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.service.processResume(parsed.data);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
