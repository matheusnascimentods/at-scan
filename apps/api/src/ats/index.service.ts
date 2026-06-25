import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Analysis, Optimization } from '@prisma/client';

import { OptimizerOrchestratorAgent } from '../agents/optimizer-orchestrator/index.agent';
import { OrchestratorAgent } from '../agents/orchestrator/index.agent';
import { PrismaService } from '../prisma/index.service';
import {
  AnalyzeRequestDto,
  AnalyzeRequestSchema,
  AnalyzeResponseDto,
  AnalyzeResponseSchema,
  OptimizeAnswerDto,
  OptimizeRequestDto,
  OptimizeRequestSchema,
  OptimizeResponseDto,
  OptimizeResponseSchema,
  OptimizerAgentInputDto,
} from './index.schema';

@Injectable()
export class AtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: OrchestratorAgent,
    private readonly optimizerOrchestrator: OptimizerOrchestratorAgent,
  ) {}

  async analyze(dto: AnalyzeRequestDto): Promise<AnalyzeResponseDto> {
    this.validateAnalyzeRequest(dto);
    const agentResult = await this.callOrchestrator(dto);
    const saved = await this.persistAnalysis(dto, agentResult);
    return this.toAnalyzeResponse(saved);
  }

  async optimize(dto: OptimizeRequestDto): Promise<OptimizeResponseDto> {
    this.validateOptimizeRequest(dto);
    const analysis = await this.findAnalysisOrThrow(dto.analysisId);
    const filteredAnswers = this.filterNonEmptyAnswers(dto.answers);
    const agentInput = this.buildOptimizerInput(analysis, dto, filteredAnswers);
    const agentResult = await this.callOptimizer(agentInput);
    const saved = await this.persistOptimization(
      dto.analysisId,
      analysis.score,
      filteredAnswers,
      agentResult,
    );
    return this.toOptimizeResponse(saved);
  }

  async findAnalysisById(id: string): Promise<AnalyzeResponseDto> {
    const analysis = await this.findAnalysisOrThrow(id);
    return this.toAnalyzeResponse(analysis);
  }

  async findOptimizationById(id: string): Promise<OptimizeResponseDto> {
    const optimization = await this.findOptimizationOrThrow(id);
    return this.toOptimizeResponse(optimization);
  }

  private validateAnalyzeRequest(dto: AnalyzeRequestDto): void {
    const parsed = AnalyzeRequestSchema.safeParse(dto);
    if (!parsed.success) {
      throw new HttpException(
        'Dados de análise inválidos',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateOptimizeRequest(dto: OptimizeRequestDto): void {
    const parsed = OptimizeRequestSchema.safeParse(dto);
    if (!parsed.success) {
      throw new HttpException(
        'Dados de otimização inválidos',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async callOrchestrator(
    dto: AnalyzeRequestDto,
  ): Promise<Omit<AnalyzeResponseDto, 'id'>> {
    try {
      const result = await this.orchestrator.analyze(dto);
      const { id: _id, ...agentResult } = result;
      return agentResult;
    } catch {
      throw new HttpException(
        'Erro ao processar análise com IA',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private async callOptimizer(
    input: OptimizerAgentInputDto,
  ): Promise<Omit<OptimizeResponseDto, 'id'>> {
    try {
      const result = await this.optimizerOrchestrator.optimize(input);
      const { id: _id, ...agentResult } = result;
      return agentResult;
    } catch {
      throw new HttpException(
        'Erro ao processar otimização com IA',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private filterNonEmptyAnswers(
    answers: OptimizeAnswerDto[],
  ): OptimizeAnswerDto[] {
    return answers.filter((answer) => answer.answer.trim() !== '');
  }

  private buildOptimizerInput(
    analysis: Analysis,
    dto: OptimizeRequestDto,
    filteredAnswers: OptimizeAnswerDto[],
  ): OptimizerAgentInputDto {
    return {
      analysisId: dto.analysisId,
      answers: filteredAnswers,
      resumeId: analysis.resumeId,
      resumeContent: analysis.resumeContent,
      jobDescription: analysis.jobDescription,
    };
  }

  private async findAnalysisOrThrow(id: string): Promise<Analysis> {
    const analysis = await this.prisma.analysis.findUnique({ where: { id } });
    if (!analysis) {
      throw new HttpException('Análise não encontrada', HttpStatus.NOT_FOUND);
    }
    return analysis;
  }

  private async findOptimizationOrThrow(id: string): Promise<Optimization> {
    const optimization = await this.prisma.optimization.findUnique({
      where: { id },
    });
    if (!optimization) {
      throw new HttpException(
        'Otimização não encontrada',
        HttpStatus.NOT_FOUND,
      );
    }
    return optimization;
  }

  private async persistAnalysis(
    dto: AnalyzeRequestDto,
    agentResult: Omit<AnalyzeResponseDto, 'id'>,
  ): Promise<Analysis> {
    return this.prisma.analysis.create({
      data: {
        resumeId: dto.resumeId,
        resumeContent: dto.resumeContent,
        jobDescription: dto.jobDescription,
        score: agentResult.score,
        breakdown: agentResult.breakdown,
        matchedKeywords: agentResult.matchedKeywords,
        missingKeywords: agentResult.missingKeywords,
        formatIssues: agentResult.formatIssues,
        recommendations: agentResult.recommendations,
        questions: agentResult.questions,
      },
    });
  }

  private async persistOptimization(
    analysisId: string,
    previousScore: number,
    answers: OptimizeAnswerDto[],
    agentResult: Omit<OptimizeResponseDto, 'id'>,
  ): Promise<Optimization> {
    return this.prisma.optimization.create({
      data: {
        analysisId,
        previousScore,
        newScore: agentResult.newScore,
        gain: agentResult.gain,
        optimizedContent: agentResult.optimizedContent,
        changes: agentResult.changes,
        answers,
      },
    });
  }

  private toAnalyzeResponse(record: Analysis): AnalyzeResponseDto {
    return AnalyzeResponseSchema.parse({
      id: record.id,
      score: record.score,
      breakdown: record.breakdown,
      matchedKeywords: record.matchedKeywords,
      missingKeywords: record.missingKeywords,
      formatIssues: record.formatIssues,
      recommendations: record.recommendations,
      questions: record.questions,
    });
  }

  private toOptimizeResponse(record: Optimization): OptimizeResponseDto {
    return OptimizeResponseSchema.parse({
      id: record.id,
      previousScore: record.previousScore,
      newScore: record.newScore,
      gain: record.gain,
      optimizedContent: record.optimizedContent,
      changes: record.changes,
    });
  }
}
