jest.mock('@google/adk', () => ({
  InMemorySessionService: jest.fn(),
  LlmAgent: jest.fn(),
  Runner: jest
    .fn()
    .mockImplementation(() => ({ runEphemeral: jest.fn() })),
  stringifyContent: jest.fn(),
}));

import { HttpStatus } from '@nestjs/common';
import { Resume } from '@prisma/client';

import { PrismaService } from '../prisma/index.service';
import { ProcessResumeDto } from './index.schema';
import { ResumesService } from './index.service';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const validBase64 = Buffer.from('conteudo-pdf').toString('base64');

describe('ResumesService', () => {
  let service: ResumesService;
  let prisma: jest.Mocked<Pick<PrismaService, 'resume'>>;
  let mockResumeParserAgent: { run: jest.Mock };

  beforeEach(() => {
    prisma = {
      resume: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<Pick<PrismaService, 'resume'>>;

    mockResumeParserAgent = { run: jest.fn() };

    service = new ResumesService(
      prisma as unknown as PrismaService,
      mockResumeParserAgent as never,
    );
  });

  describe('processResume', () => {
    const validDto: ProcessResumeDto = {
      fileBase64: validBase64,
      fileName: 'curriculo.pdf',
    };

    it('base64 válido → chama agente, persiste e retorna ResumeResponseDto com id', async () => {
      const markdown = '# Currículo em Markdown';
      mockResumeParserAgent.run.mockResolvedValue(markdown);
      prisma.resume.create.mockResolvedValue(
        persistedResume(markdown, validDto.fileName),
      );

      const result = await service.processResume(validDto);

      expect(mockResumeParserAgent.run).toHaveBeenCalledWith(validDto);
      expect(prisma.resume.create).toHaveBeenCalledWith({
        data: {
          content: markdown,
          fileName: validDto.fileName,
          fileSize: Buffer.from(validBase64, 'base64').length,
          language: 'pt',
        },
      });
      expect(result.id).toBe(VALID_UUID);
      expect(result.content).toBe(markdown);
      expect(result.fileName).toBe(validDto.fileName);
      expect(result.createdAt).toBeDefined();
    });

    it('base64 inválido/corrompido → HttpException 422', async () => {
      await expect(
        service.processResume({
          ...validDto,
          fileBase64: '!!!invalid-base64!!!',
        }),
      ).rejects.toMatchObject({ status: HttpStatus.UNPROCESSABLE_ENTITY });
      expect(mockResumeParserAgent.run).not.toHaveBeenCalled();
    });

    it('PDF vazio (0 bytes após decode) → HttpException 422', async () => {
      await expect(
        service.processResume({
          ...validDto,
          fileBase64: '===',
        }),
      ).rejects.toMatchObject({ status: HttpStatus.UNPROCESSABLE_ENTITY });
      expect(mockResumeParserAgent.run).not.toHaveBeenCalled();
    });

    it('agente retorna string vazia → HttpException 502', async () => {
      mockResumeParserAgent.run.mockResolvedValue('   ');

      await expect(service.processResume(validDto)).rejects.toMatchObject({
        status: HttpStatus.BAD_GATEWAY,
      });
      expect(prisma.resume.create).not.toHaveBeenCalled();
    });

    it('agente lança exceção → HttpException 502', async () => {
      mockResumeParserAgent.run.mockRejectedValue(new Error('timeout'));

      await expect(service.processResume(validDto)).rejects.toMatchObject({
        status: HttpStatus.BAD_GATEWAY,
      });
      expect(prisma.resume.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('id existente → retorna ResumeResponseDto correto', async () => {
      const resume = persistedResume('# Markdown', 'cv.pdf');
      prisma.resume.findUnique.mockResolvedValue(resume);

      const result = await service.findById(VALID_UUID);

      expect(result).toEqual({
        id: resume.id,
        content: resume.content,
        fileName: resume.fileName,
        createdAt: resume.createdAt.toISOString(),
      });
    });

    it('id inexistente → HttpException 404', async () => {
      prisma.resume.findUnique.mockResolvedValue(null);

      await expect(service.findById(VALID_UUID)).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('id com formato inválido → HttpException 400', async () => {
      await expect(service.findById('invalid-id')).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
      expect(prisma.resume.findUnique).not.toHaveBeenCalled();
    });
  });
});

function persistedResume(content: string, fileName: string): Resume {
  return {
    id: VALID_UUID,
    content,
    fileName,
    fileSize: Buffer.from(validBase64, 'base64').length,
    language: 'pt',
    createdAt: new Date('2026-01-15T10:00:00.000Z'),
  };
}
