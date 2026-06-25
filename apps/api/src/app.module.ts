import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/index.module';
import { ResumesModule } from './resumes/index.module';
import { AtsModule } from './ats/index.module';
import { AgentsModule } from './agents/index.module';

@Module({
  imports: [PrismaModule, ResumesModule, AtsModule, AgentsModule],
})
export class AppModule {}
