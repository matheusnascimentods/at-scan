import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { OptimizerOrchestratorAgent } from "src/agents/optimizer-orchestrator/index.agent";
import { OrchestratorAgent } from "src/agents/orchestrator/index.agent";
import { AnalyzeRequestDto } from "./index.schema";

@Injectable()
export class AtsService {
    constructor(
        private readonly orchestrator: OrchestratorAgent,
        private readonly optimizerOrchestrator: OptimizerOrchestratorAgent,
    ) {}

  private async runAnalysis(dto: AnalyzeRequestDto) {
    try {
      return await this.orchestrator.analyze(dto);
    } catch {
      throw new HttpException('Erro ao processar análise com IA', HttpStatus.BAD_GATEWAY);
    }
  }
}