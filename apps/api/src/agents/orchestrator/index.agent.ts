import { Injectable } from '@nestjs/common';
import {
  InMemorySessionService,
  LlmAgent,
  Runner,
  stringifyContent,
} from '@google/adk';
import * as fs from 'fs';

import {
  AnalyzeRequestDto,
  AnalyzeResponseDto,
  AnalyzeResponseSchema,
  FormatCheckerOutputDto,
  JobParserOutputDto,
  ResumeParserOutputDto,
  SemanticMatchOutputDto,
} from '../../ats/index.schema';
import { FormatCheckerAgent } from '../format-checker/index.agent';
import { JobParserAgent } from '../job-parser/index.agent';
import { QuestionGeneratorAgent } from '../question-generator/index.agent';
import { ResumeParserAgent } from '../resume-parser/index.agent';
import { SemanticMatchAgent } from '../semantic-match/index.agent';

const PROMPT = fs.readFileSync(__dirname + '/index.prompt.md', 'utf-8');
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';

@Injectable()
export class OrchestratorAgent {
  constructor(
    private readonly resumeParser: ResumeParserAgent,
    private readonly jobParser: JobParserAgent,
    private readonly semanticMatch: SemanticMatchAgent,
    private readonly formatChecker: FormatCheckerAgent,
    private readonly questionGenerator: QuestionGeneratorAgent,
  ) {}

  async analyze(request: AnalyzeRequestDto): Promise<AnalyzeResponseDto> {
    const [resumeData, jobData] = await this.runParsers(request);
    const [matchData, formatData] = await this.runCheckers(
      request,
      resumeData,
      jobData,
    );
    const analysis = await this.consolidate(
      resumeData,
      jobData,
      matchData,
      formatData,
    );
    const questions = await this.questionGenerator.generateQuestions(
      matchData.missingKeywords,
      jobData,
    );

    return AnalyzeResponseSchema.parse({
      ...analysis,
      questions: questions.questions,
    });
  }

  private runParsers(
    request: AnalyzeRequestDto,
  ): Promise<[ResumeParserOutputDto, JobParserOutputDto]> {
    return Promise.all([
      this.resumeParser.parseResume(request.resumeContent),
      this.jobParser.parseJob(request.jobDescription),
    ]);
  }

  private runCheckers(
    request: AnalyzeRequestDto,
    resumeData: ResumeParserOutputDto,
    jobData: JobParserOutputDto,
  ): Promise<[SemanticMatchOutputDto, FormatCheckerOutputDto]> {
    return Promise.all([
      this.semanticMatch.match(resumeData, jobData),
      this.formatChecker.checkFormat(request.resumeContent),
    ]);
  }

  private async consolidate(
    resumeParserOutput: ResumeParserOutputDto,
    jobParserOutput: JobParserOutputDto,
    semanticMatchOutput: SemanticMatchOutputDto,
    formatCheckerOutput: FormatCheckerOutputDto,
  ): Promise<AnalyzeResponseDto> {
    const parsed = await this.run({
      resumeParserOutput,
      jobParserOutput,
      semanticMatchOutput,
      formatCheckerOutput,
    });

    return AnalyzeResponseSchema.parse(parsed);
  }

  private buildRunner(): Runner {
    const agent = new LlmAgent({
      name: 'OrchestratorAgent',
      model: MODEL,
      instruction: PROMPT,
    });

    return new Runner({
      appName: 'ats-orchestrator',
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
