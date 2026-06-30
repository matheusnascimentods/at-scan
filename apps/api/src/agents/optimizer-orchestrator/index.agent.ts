import { Injectable } from '@nestjs/common';
import {
  InMemorySessionService,
  LlmAgent,
  Runner,
  stringifyContent,
} from '@google/adk';
import * as fs from 'fs';

import {
  AnalyzeResponseDto,
  OptimizeAnswerDto,
  OptimizeResponseDto,
  OptimizeResponseSchema,
  OptimizerAgentInputDto,
  ResumeOptimizerOutputDto,
} from '../../ats/index.schema';
import { OrchestratorAgent } from '../orchestrator/index.agent';
import { ResumeOptimizerAgent } from '../resume-optimizer/index.agent';

const PROMPT = fs.readFileSync(__dirname + '/index.prompt.md', 'utf-8');
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';

@Injectable()
export class OptimizerOrchestratorAgent {
  constructor(
    private readonly orchestrator: OrchestratorAgent,
    private readonly resumeOptimizer: ResumeOptimizerAgent,
  ) {}

  async optimize(
    request: OptimizerAgentInputDto,
  ): Promise<OptimizeResponseDto> {
    const analyzeResult = await this.orchestrator.analyze(request);
    const answers = this.nonEmptyAnswers(request.answers);
    const optimizerOutput = await this.resumeOptimizer.optimizeResume(
      request.resumeContent,
      request.jobDescription,
      analyzeResult,
      answers,
    );

    return this.consolidate(request, analyzeResult, optimizerOutput, answers);
  }

  private nonEmptyAnswers(answers: OptimizeAnswerDto[]): OptimizeAnswerDto[] {
    return answers.filter((answer) => answer.answer.trim().length > 0);
  }

  private async consolidate(
    request: OptimizerAgentInputDto,
    analyzeResult: AnalyzeResponseDto,
    resumeOptimizerOutput: ResumeOptimizerOutputDto,
    answers: OptimizeAnswerDto[],
  ): Promise<OptimizeResponseDto> {
    const parsed = await this.run({
      resumeContent: request.resumeContent,
      jobDescription: request.jobDescription,
      answers,
      previousScore: analyzeResult.score,
      analyzeResult,
      resumeOptimizerOutput,
    });

    return OptimizeResponseSchema.parse(parsed);
  }

  private buildRunner(): Runner {
    const agent = new LlmAgent({
      name: 'OptimizerOrchestratorAgent',
      model: MODEL,
      instruction: PROMPT,
    });

    return new Runner({
      appName: 'ats-optimizer-orchestrator',
      agent,
      sessionService: new InMemorySessionService(),
    });
  }

  private async run(payload: object): Promise<unknown> {
    const runner = this.buildRunner();
    const response = await this.collectResponse(runner, payload);

    return JSON.parse(this.cleanJson(response));
  }

  private async collectResponse(
    runner: Runner,
    payload: object,
  ): Promise<string> {
    let response = '';

    for await (const event of runner.runEphemeral(this.message(payload))) {
      const text = stringifyContent(event).trim();
      response = text.length > 0 ? text : response;
    }

    return response;
  }

  private message(payload: object): Parameters<Runner['runEphemeral']>[0] {
    return {
      userId: 'ats-api',
      newMessage: { parts: [{ text: JSON.stringify(payload) }] },
    };
  }

  private cleanJson(text: string): string {
    return text
      .replace(/^```json\s*/u, '')
      .replace(/^```\s*/u, '')
      .replace(/\s*```$/u, '');
  }
}
