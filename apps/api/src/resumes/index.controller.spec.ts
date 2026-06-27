jest.mock('./index.service', () => ({
  ResumesService: jest.fn(),
}));

import { HttpException, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { ResumesController } from './index.controller';
import { ResumeResponseDto } from './index.schema';
import { ResumesService } from './index.service';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const validBase64 = Buffer.from('conteudo-pdf').toString('base64');

describe('ResumesController', () => {
  let app: INestApplication;
  let service: jest.Mocked<
    Pick<ResumesService, 'processResume' | 'findById'>
  >;

  beforeEach(async () => {
    service = {
      processResume: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResumesController],
      providers: [{ provide: ResumesService, useValue: service }],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /resumes', () => {
    it('payload válido com base64 real → 201 + body completo', async () => {
      const response = resumeResponse();
      service.processResume.mockResolvedValue(response);

      const { body, status } = await request(app.getHttpServer())
        .post('/resumes')
        .send({
          fileBase64: validBase64,
          fileName: 'curriculo.pdf',
        });

      expect(status).toBe(201);
      expect(body.id).toBe(response.id);
      expect(body.content).toBe(response.content);
      expect(body.fileName).toBe(response.fileName);
      expect(body.createdAt).toBe(response.createdAt);
    });

    it('sem campo fileBase64 → 400', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/resumes')
        .send({ fileName: 'curriculo.pdf' });

      expect(status).toBe(400);
      expect(service.processResume).not.toHaveBeenCalled();
    });

    it('sem campo fileName → 400', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/resumes')
        .send({ fileBase64: validBase64 });

      expect(status).toBe(400);
    });

    it('fileBase64 vazio → 400', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/resumes')
        .send({ fileBase64: '', fileName: 'curriculo.pdf' });

      expect(status).toBe(400);
    });

    it('fileBase64 não é string base64 válida → 422', async () => {
      service.processResume.mockRejectedValue(
        new HttpException('Base64 inválido', HttpStatus.UNPROCESSABLE_ENTITY),
      );

      const { status } = await request(app.getHttpServer())
        .post('/resumes')
        .send({
          fileBase64: '!!!invalid-base64!!!',
          fileName: 'curriculo.pdf',
        });

      expect(status).toBe(422);
    });
  });

  describe('GET /resumes/:id', () => {
    it('id existente → 200 + body completo', async () => {
      const response = resumeResponse();
      service.findById.mockResolvedValue(response);

      const { body, status } = await request(app.getHttpServer()).get(
        `/resumes/${VALID_UUID}`,
      );

      expect(status).toBe(200);
      expect(body).toEqual(response);
    });

    it('id inexistente → 404', async () => {
      service.findById.mockRejectedValue(
        new HttpException('Currículo não encontrado', HttpStatus.NOT_FOUND),
      );

      const { status } = await request(app.getHttpServer()).get(
        `/resumes/${VALID_UUID}`,
      );

      expect(status).toBe(404);
    });

    it('id mal formatado → 400', async () => {
      service.findById.mockRejectedValue(
        new HttpException('ID inválido', HttpStatus.BAD_REQUEST),
      );

      const { status } = await request(app.getHttpServer()).get(
        '/resumes/not-a-uuid',
      );

      expect(status).toBe(400);
    });
  });
});

function resumeResponse(): ResumeResponseDto {
  return {
    id: VALID_UUID,
    content: '# Currículo em Markdown',
    fileName: 'curriculo.pdf',
    createdAt: '2026-01-15T10:00:00.000Z',
  };
}
