jest.mock('./index.service', () => ({
  AtsService: jest.fn(),
}));

import { HttpException, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AtsController } from './index.controller';
import {
  AnalyzeResponseDto,
  OptimizeResponseDto,
} from './index.schema';
import { AtsService } from './index.service';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const ANALYSIS_ID = '223e4567-e89b-12d3-a456-426614174001';
const OPTIMIZATION_ID = '323e4567-e89b-12d3-a456-426614174002';
const resumeContent = 'a'.repeat(100);
const jobDescription = 'b'.repeat(50);

describe('AtsController', () => {
  let app: INestApplication;
  let service: jest.Mocked<
    Pick<
      AtsService,
      'analyze' | 'findAnalysisById' | 'optimize' | 'findOptimizationById'
    >
  >;

  beforeEach(async () => {
    service = {
      analyze: jest.fn(),
      findAnalysisById: jest.fn(),
      optimize: jest.fn(),
      findOptimizationById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AtsController],
      providers: [{ provide: AtsService, useValue: service }],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /ats/analyze', () => {
    it('payload válido → 201 + body completo', async () => {
      const response = analyzeResponse();
      service.analyze.mockResolvedValue(response);

      const { body, status } = await request(app.getHttpServer())
        .post('/ats/analyze')
        .send({
          resumeId: VALID_UUID,
          resumeContent,
          jobDescription,
        });

      expect(status).toBe(201);
      expect(body.id).toBe(response.id);
      expect(body.score).toBe(response.score);
      expect(body.breakdown).toEqual(response.breakdown);
      expect(body.matchedKeywords).toEqual(response.matchedKeywords);
      expect(body.questions).toEqual(response.questions);
    });

    it('sem resumeId → 400', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/ats/analyze')
        .send({ resumeContent, jobDescription });

      expect(status).toBe(400);
      expect(service.analyze).not.toHaveBeenCalled();
    });

    it('resumeId com formato inválido → 400', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/ats/analyze')
        .send({ resumeId: 'bad', resumeContent, jobDescription });

      expect(status).toBe(400);
    });

    it('sem resumeContent → 400', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/ats/analyze')
        .send({ resumeId: VALID_UUID, jobDescription });

      expect(status).toBe(400);
    });

    it('sem jobDescription → 400', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/ats/analyze')
        .send({ resumeId: VALID_UUID, resumeContent });

      expect(status).toBe(400);
    });

    it('resumeContent com menos de 100 chars → 400', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/ats/analyze')
        .send({
          resumeId: VALID_UUID,
          resumeContent: 'curto',
          jobDescription,
        });

      expect(status).toBe(400);
    });

    it('jobDescription com menos de 50 chars → 400', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/ats/analyze')
        .send({
          resumeId: VALID_UUID,
          resumeContent,
          jobDescription: 'curto',
        });

      expect(status).toBe(400);
    });
  });

  describe('GET /ats/analyze/:id', () => {
    it('id existente → 200 + body completo', async () => {
      const response = analyzeResponse();
      service.findAnalysisById.mockResolvedValue(response);

      const { body, status } = await request(app.getHttpServer()).get(
        `/ats/analyze/${ANALYSIS_ID}`,
      );

      expect(status).toBe(200);
      expect(body).toEqual(response);
    });

    it('id inexistente → 404', async () => {
      service.findAnalysisById.mockRejectedValue(
        new HttpException('Análise não encontrada', HttpStatus.NOT_FOUND),
      );

      const { status } = await request(app.getHttpServer()).get(
        `/ats/analyze/${ANALYSIS_ID}`,
      );

      expect(status).toBe(404);
    });
  });

  describe('POST /ats/optimize', () => {
    const validPayload = {
      analysisId: ANALYSIS_ID,
      answers: [
        {
          tag: 'Containers',
          question: 'Tem experiência?',
          answer: 'Sim.',
        },
      ],
    };

    it('payload válido com answers preenchidos → 201 + body completo', async () => {
      const response = optimizeResponse();
      service.optimize.mockResolvedValue(response);

      const { body, status } = await request(app.getHttpServer())
        .post('/ats/optimize')
        .send(validPayload);

      expect(status).toBe(201);
      expect(body.id).toBe(response.id);
      expect(body.previousScore).toBe(response.previousScore);
      expect(body.newScore).toBe(response.newScore);
      expect(body.gain).toBe(response.gain);
      expect(body.optimizedContent).toBe(response.optimizedContent);
      expect(body.changes).toEqual(response.changes);
    });

    it('payload válido com answers todos vazios → 201', async () => {
      service.optimize.mockResolvedValue(optimizeResponse());

      const { status } = await request(app.getHttpServer())
        .post('/ats/optimize')
        .send({
          analysisId: ANALYSIS_ID,
          answers: [{ tag: 'A', question: 'Q?', answer: '' }],
        });

      expect(status).toBe(201);
      expect(service.optimize).toHaveBeenCalled();
    });

    it('analysisId inexistente → 404', async () => {
      service.optimize.mockRejectedValue(
        new HttpException('Análise não encontrada', HttpStatus.NOT_FOUND),
      );

      const { status } = await request(app.getHttpServer())
        .post('/ats/optimize')
        .send(validPayload);

      expect(status).toBe(404);
    });

    it('sem analysisId → 400', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/ats/optimize')
        .send({ answers: validPayload.answers });

      expect(status).toBe(400);
    });

    it('sem answers → 400', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/ats/optimize')
        .send({ analysisId: ANALYSIS_ID });

      expect(status).toBe(400);
    });

    it('answers não é array → 400', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/ats/optimize')
        .send({ analysisId: ANALYSIS_ID, answers: 'invalid' });

      expect(status).toBe(400);
    });

    it('item de answers sem campo question → 400', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/ats/optimize')
        .send({
          analysisId: ANALYSIS_ID,
          answers: [{ tag: 'A', answer: 'Sim' }],
        });

      expect(status).toBe(400);
    });
  });

  describe('GET /ats/optimize/:id', () => {
    it('id existente → 200 + body completo', async () => {
      const response = optimizeResponse();
      service.findOptimizationById.mockResolvedValue(response);

      const { body, status } = await request(app.getHttpServer()).get(
        `/ats/optimize/${OPTIMIZATION_ID}`,
      );

      expect(status).toBe(200);
      expect(body).toEqual(response);
    });

    it('id inexistente → 404', async () => {
      service.findOptimizationById.mockRejectedValue(
        new HttpException('Otimização não encontrada', HttpStatus.NOT_FOUND),
      );

      const { status } = await request(app.getHttpServer()).get(
        `/ats/optimize/${OPTIMIZATION_ID}`,
      );

      expect(status).toBe(404);
    });
  });
});

function analyzeResponse(): AnalyzeResponseDto {
  return {
    id: ANALYSIS_ID,
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
  };
}

function optimizeResponse(): OptimizeResponseDto {
  return {
    id: OPTIMIZATION_ID,
    previousScore: 73,
    newScore: 91,
    gain: 18,
    optimizedContent: '# Currículo otimizado',
    changes: [{ section: 'Skills', description: 'Adicionado Kubernetes.' }],
  };
}
