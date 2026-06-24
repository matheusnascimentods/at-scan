import { Module } from '@nestjs/common';

import { FormatCheckerAgent } from './format-checker/index.agent';
import { JobParserAgent } from './job-parser/index.agent';
import { OptimizerOrchestratorAgent } from './optimizer-orchestrator/index.agent';
import { OrchestratorAgent } from './orchestrator/index.agent';
import { QuestionGeneratorAgent } from './question-generator/index.agent';
import { ResumeOptimizerAgent } from './resume-optimizer/index.agent';
import { ResumeParserAgent } from './resume-parser/index.agent';
import { SemanticMatchAgent } from './semantic-match/index.agent';

@Module({
  providers: [
    OrchestratorAgent,
    ResumeParserAgent,
    JobParserAgent,
    SemanticMatchAgent,
    FormatCheckerAgent,
    QuestionGeneratorAgent,
    OptimizerOrchestratorAgent,
    ResumeOptimizerAgent,
  ],
  exports: [
    OrchestratorAgent,
    ResumeParserAgent,
    JobParserAgent,
    SemanticMatchAgent,
    FormatCheckerAgent,
    QuestionGeneratorAgent,
    OptimizerOrchestratorAgent,
    ResumeOptimizerAgent,
  ],
})
export class AgentsModule {}
