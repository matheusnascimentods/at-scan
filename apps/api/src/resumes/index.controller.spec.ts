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
const pdfBuffer = Buffer.from('%PDF-1.4 conteudo-pdf');

describe('ResumesController', () => {
  let app: INestApplication;
  let service: jest.Mocked<Pick<ResumesService, 'processResume' | 'findById'>>;

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
    it('multipart válido com PDF real → 201 + body completo', async () => {
      const response = resumeResponse();
      service.processResume.mockResolvedValue(response);

      const { body, status } = await request(app.getHttpServer())
        .post('/resumes')
        .attach('file', pdfBuffer, {
          filename: 'curriculo.pdf',
          contentType: 'application/pdf',
        });

      expect(status).toBe(201);
      expect(service.processResume).toHaveBeenCalledWith({
        fileBase64: pdfBuffer.toString('base64'),
        fileName: 'curriculo.pdf',
        mimeType: 'application/pdf',
      });
      expect(body.id).toBe(response.id);
      expect(body.content).toBe(response.content);
      expect(body.fileName).toBe(response.fileName);
      expect(body.createdAt).toBe(response.createdAt);
    });

    it('sem arquivo → 400', async () => {
      const { status } = await request(app.getHttpServer()).post('/resumes');

      expect(status).toBe(400);
      expect(service.processResume).not.toHaveBeenCalled();
    });

    it('arquivo sem extensão e mimetype PDF → 201', async () => {
      const response = resumeResponse();
      service.processResume.mockResolvedValue(response);

      const { status } = await request(app.getHttpServer())
        .post('/resumes')
        .attach('file', pdfBuffer, {
          filename: 'curriculo',
          contentType: 'application/pdf',
        });

      expect(status).toBe(201);
    });

    it('arquivo não PDF → 400', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/resumes')
        .attach('file', Buffer.from('texto'), {
          filename: 'curriculo.txt',
          contentType: 'text/plain',
        });

      expect(status).toBe(400);
      expect(service.processResume).not.toHaveBeenCalled();
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
