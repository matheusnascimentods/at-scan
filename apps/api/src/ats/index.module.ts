import { Module } from '@nestjs/common';

import { AgentsModule } from '../agents/index.module';
import { AtsController } from './index.controller';
import { AtsService } from './index.service';

@Module({
  imports: [AgentsModule],
  controllers: [AtsController],
  providers: [AtsService],
})
export class AtsModule {}
