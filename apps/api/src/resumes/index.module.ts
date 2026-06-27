import { Module } from '@nestjs/common';

import { AgentsModule } from '../agents/index.module';
import { ResumesController } from './index.controller';
import { ResumesService } from './index.service';

@Module({
  imports: [AgentsModule],
  controllers: [ResumesController],
  providers: [ResumesService],
})
export class ResumesModule {}
