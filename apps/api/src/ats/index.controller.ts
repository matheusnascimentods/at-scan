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

import {
  AnalyzeRequestSchema,
  OptimizeRequestSchema,
} from './index.schema';
import { AtsService } from './index.service';

@Controller('ats')
export class AtsController {
  constructor(private readonly service: AtsService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.CREATED)
  analyze(@Body() body: unknown) {
    const parsed = AnalyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException(
        'Dados de análise inválidos',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.service.analyze(parsed.data);
  }

  @Get('analyze/:id')
  findAnalysisById(@Param('id') id: string) {
    return this.service.findAnalysisById(id);
  }

  @Post('optimize')
  @HttpCode(HttpStatus.CREATED)
  optimize(@Body() body: unknown) {
    const parsed = OptimizeRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException(
        'Dados de otimização inválidos',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.service.optimize(parsed.data);
  }

  @Get('optimize/:id')
  findOptimizationById(@Param('id') id: string) {
    return this.service.findOptimizationById(id);
  }
}
