jest.mock('@google/adk', () => ({
  InMemorySessionService: jest.fn(),
  LlmAgent: jest.fn(),
  Runner: jest
    .fn()
    .mockImplementation(() => ({ runEphemeral: jest.fn() })),
  stringifyContent: jest.fn(),
}));

import { HttpStatus } from '@nestjs/common';
import { Analysis } from '@prisma/client';

import { OptimizerOrchestratorAgent } from '../agents/optimizer-orchestrator/index.agent';
import { OrchestratorAgent } from '../agents/orchestrator/index.agent';
import { PrismaService } from '../prisma/index.service';
import {
  AnalyzeRequestDto,
  AnalyzeResponseDto,
  OptimizeRequestDto,
  OptimizeResponseDto,
} from './index.schema';
import { AtsService } from './index.service';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const ANALYSIS_ID = '223e4567-e89b-12d3-a456-426614174001';
const OPTIMIZATION_ID = '323e4567-e89b-12d3-a456-426614174002';
const resumeContent = 'a'.repeat(100);
const jobDescription = 'b'.repeat(50);

describe('AtsService', () => {
  let service: AtsService;
  let prisma: jest.Mocked<Pick<PrismaService, 'analysis' | 'optimization'>>;
  let orchestrator: jest.Mocked<Pick<OrchestratorAgent, 'analyze'>>;
  let optimizerOrchestrator: jest.Mocked<
    Pick<OptimizerOrchestratorAgent, 'optimize'>
  >;

  beforeEach(() => {
    prisma = {
      analysis: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      optimization: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<Pick<PrismaService, 'analysis' | 'optimization'>>;

    orchestrator = { analyze: jest.fn() };
    optimizerOrchestrator = { optimize: jest.fn() };

    service = new AtsService(
      prisma as unknown as PrismaService,
      orchestrator as unknown as OrchestratorAgent,
      optimizerOrchestrator as unknown as OptimizerOrchestratorAgent,
    );
  });

  describe('analyze', () => {
    const validDto: AnalyzeRequestDto = {
      resumeId: VALID_UUID,
      resumeContent,
      jobDescription,
    };

    it('inputs válidos → chama orquestrador, persiste e retorna com id', async () => {
      const agentResult = agentAnalyzeResult();
      orchestrator.analyze.mockResolvedValue({
        id: 'ignored',
        ...agentResult,
      });
      prisma.analysis.create.mockResolvedValue(
        persistedAnalysis(agentResult),
      );

      const result = await service.analyze(validDto);

      expect(orchestrator.analyze).toHaveBeenCalledWith(validDto);
      expect(prisma.analysis.create).toHaveBeenCalledWith({
        data: {
          resumeId: validDto.resumeId,
          resumeContent: validDto.resumeContent,
          jobDescription: validDto.jobDescription,
          score: agentResult.score,
          breakdown: agentResult.breakdown,
          matchedKeywords: agentResult.matchedKeywords,
          missingKeywords: agentResult.missingKeywords,
          formatIssues: agentResult.formatIssues,
          recommendations: agentResult.recommendations,
          questions: agentResult.questions,
        },
      });
      expect(result.id).toBe(ANALYSIS_ID);
      expect(result.score).toBe(agentResult.score);
    });

    it('resumeId ausente → HttpException 400', async () => {
      await expect(
        service.analyze({ ...validDto, resumeId: undefined as unknown as string }),
      ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
      expect(orchestrator.analyze).not.toHaveBeenCalled();
    });

    it('resumeId com formato inválido → HttpException 400', async () => {
      await expect(
        service.analyze({ ...validDto, resumeId: 'invalid' }),
      ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
      expect(orchestrator.analyze).not.toHaveBeenCalled();
    });

    it('resumeContent com menos de 100 chars → HttpException 400', async () => {
      await expect(
        service.analyze({ ...validDto, resumeContent: 'curto' }),
      ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
      expect(orchestrator.analyze).not.toHaveBeenCalled();
    });

    it('jobDescription com menos de 50 chars → HttpException 400', async () => {
      await expect(
        service.analyze({ ...validDto, jobDescription: 'curto' }),
      ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
      expect(orchestrator.analyze).not.toHaveBeenCalled();
    });

    it('agente retorna score 0 → retorna normalmente', async () => {
      const agentResult = agentAnalyzeResult({ score: 0, matchedKeywords: [] });
      orchestrator.analyze.mockResolvedValue({ id: 'ignored', ...agentResult });
      prisma.analysis.create.mockResolvedValue(
        persistedAnalysis(agentResult),
      );

      const result = await service.analyze(validDto);

      expect(result.score).toBe(0);
      expect(result.matchedKeywords).toEqual([]);
    });

    it('agente falha → HttpException 502', async () => {
      orchestrator.analyze.mockRejectedValue(new Error('timeout'));

      await expect(service.analyze(validDto)).rejects.toMatchObject({
        status: HttpStatus.BAD_GATEWAY,
      });
      expect(prisma.analysis.create).not.toHaveBeenCalled();
    });
  });

  describe('optimize', () => {
    const validDto: OptimizeRequestDto = {
      analysisId: ANALYSIS_ID,
      answers: [
        {
          tag: 'Containers',
          question: 'Tem experiência?',
          answer: 'Sim, usei Docker.',
        },
      ],
    };

    it('analysisId válido + respostas preenchidas → busca, otimiza, persiste', async () => {
      const analysis = persistedAnalysis(agentAnalyzeResult());
      const agentResult = agentOptimizeResult();
      prisma.analysis.findUnique.mockResolvedValue(analysis);
      optimizerOrchestrator.optimize.mockResolvedValue({
        id: 'ignored',
        ...agentResult,
      });
      prisma.optimization.create.mockResolvedValue(
        persistedOptimization(agentResult),
      );

      const result = await service.optimize(validDto);

      expect(prisma.analysis.findUnique).toHaveBeenCalledWith({
        where: { id: ANALYSIS_ID },
      });
      expect(optimizerOrchestrator.optimize).toHaveBeenCalledWith({
        analysisId: ANALYSIS_ID,
        answers: validDto.answers,
        resumeId: analysis.resumeId,
        resumeContent: analysis.resumeContent,
        jobDescription: analysis.jobDescription,
      });
      expect(prisma.optimization.create).toHaveBeenCalled();
      expect(result.id).toBe(OPTIMIZATION_ID);
    });

    it('analysisId inexistente → HttpException 404', async () => {
      prisma.analysis.findUnique.mockResolvedValue(null);

      await expect(service.optimize(validDto)).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
      expect(optimizerOrchestrator.optimize).not.toHaveBeenCalled();
    });

    it('answers todos vazios → chama otimizador com array filtrado vazio', async () => {
      const analysis = persistedAnalysis(agentAnalyzeResult());
      const agentResult = agentOptimizeResult();
      prisma.analysis.findUnique.mockResolvedValue(analysis);
      optimizerOrchestrator.optimize.mockResolvedValue({
        id: 'ignored',
        ...agentResult,
      });
      prisma.optimization.create.mockResolvedValue(
        persistedOptimization(agentResult),
      );

      await service.optimize({
        analysisId: ANALYSIS_ID,
        answers: [{ tag: 'A', question: 'Q?', answer: '' }],
      });

      expect(optimizerOrchestrator.optimize).toHaveBeenCalledWith(
        expect.objectContaining({ answers: [] }),
      );
    });

    it('mix de respostas preenchidas e vazias → só não-vazias chegam ao agente', async () => {
      const analysis = persistedAnalysis(agentAnalyzeResult());
      const agentResult = agentOptimizeResult();
      prisma.analysis.findUnique.mockResolvedValue(analysis);
      optimizerOrchestrator.optimize.mockResolvedValue({
        id: 'ignored',
        ...agentResult,
      });
      prisma.optimization.create.mockResolvedValue(
        persistedOptimization(agentResult),
      );

      const filled = {
        tag: 'Cache',
        question: 'Usou Redis?',
        answer: 'Sim.',
      };

      await service.optimize({
        analysisId: ANALYSIS_ID,
        answers: [
          filled,
          { tag: 'CI/CD', question: 'Pipelines?', answer: '   ' },
        ],
      });

      expect(optimizerOrchestrator.optimize).toHaveBeenCalledWith(
        expect.objectContaining({ answers: [filled] }),
      );
    });

    it('newScore menor que previousScore → retorna normalmente', async () => {
      const analysis = persistedAnalysis(agentAnalyzeResult({ score: 80 }));
      const agentResult = agentOptimizeResult({
        previousScore: 80,
        newScore: 65,
        gain: -15,
      });
      prisma.analysis.findUnique.mockResolvedValue(analysis);
      optimizerOrchestrator.optimize.mockResolvedValue({
        id: 'ignored',
        ...agentResult,
      });
      prisma.optimization.create.mockResolvedValue(
        persistedOptimization(agentResult),
      );

      const result = await service.optimize(validDto);

      expect(result.newScore).toBe(65);
      expect(result.gain).toBe(-15);
    });

    it('agente falha → HttpException 502', async () => {
      prisma.analysis.findUnique.mockResolvedValue(
        persistedAnalysis(agentAnalyzeResult()),
      );
      optimizerOrchestrator.optimize.mockRejectedValue(new Error('fail'));

      await expect(service.optimize(validDto)).rejects.toMatchObject({
        status: HttpStatus.BAD_GATEWAY,
      });
      expect(prisma.optimization.create).not.toHaveBeenCalled();
    });
  });
});

function agentAnalyzeResult(
  overrides: Partial<Omit<AnalyzeResponseDto, 'id'>> = {},
): Omit<AnalyzeResponseDto, 'id'> {
  return {
    score: 73,
    breakdown: {
      keywordsScore: 80,
      semanticScore: 68,
      formatScore: 90,
      sectionScore: 55,
    },
    matchedKeywords: ['Python'],
    missingKeywords: ['Kubernetes'],
    formatIssues: ['Evite tabelas.'],
    recommendations: [
      { priority: 'Alta', text: 'Adicione Kubernetes.', impact: '+6 pontos' },
    ],
    questions: [{ tag: 'Containers', text: 'Experiência com K8s?' }],
    ...overrides,
  };
}

function agentOptimizeResult(
  overrides: Partial<Omit<OptimizeResponseDto, 'id'>> = {},
): Omit<OptimizeResponseDto, 'id'> {
  return {
    previousScore: 73,
    newScore: 91,
    gain: 18,
    optimizedContent: '# Currículo otimizado',
    changes: [
      { section: 'Skills', description: 'Adicionado Kubernetes.' },
    ],
    ...overrides,
  };
}

function persistedAnalysis(
  agentResult: Omit<AnalyzeResponseDto, 'id'>,
): Analysis {
  return {
    id: ANALYSIS_ID,
    resumeId: VALID_UUID,
    resumeContent,
    jobDescription,
    score: agentResult.score,
    breakdown: agentResult.breakdown,
    matchedKeywords: agentResult.matchedKeywords,
    missingKeywords: agentResult.missingKeywords,
    formatIssues: agentResult.formatIssues,
    recommendations: agentResult.recommendations,
    questions: agentResult.questions,
    createdAt: new Date(),
  };
}

function persistedOptimization(
  agentResult: Omit<OptimizeResponseDto, 'id'>,
) {
  return {
    id: OPTIMIZATION_ID,
    analysisId: ANALYSIS_ID,
    previousScore: agentResult.previousScore,
    newScore: agentResult.newScore,
    gain: agentResult.gain,
    optimizedContent: agentResult.optimizedContent,
    changes: agentResult.changes,
    answers: [],
    createdAt: new Date(),
  };
}
