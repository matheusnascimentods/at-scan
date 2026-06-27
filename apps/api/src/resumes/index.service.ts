import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Resume } from '@prisma/client';

import { ResumeParserAgent } from '../agents/resume-parser/index.agent';
import { PrismaService } from '../prisma/index.service';
import {
  ProcessResumeDto,
  ResumeParserAgentPort,
  ResumeResponseDto,
} from './index.schema';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class ResumesService {
  private readonly resumeParserAgent: ResumeParserAgentPort;

  constructor(
    private readonly prisma: PrismaService,
    resumeParserAgent: ResumeParserAgent,
  ) {
    this.resumeParserAgent =
      resumeParserAgent as unknown as ResumeParserAgentPort;
  }

  async processResume(dto: ProcessResumeDto): Promise<ResumeResponseDto> {
    const buffer = this.decodeBase64(dto.fileBase64);
    const content = await this.extractContent(dto);
    this.ensureContentExtracted(content);
    const saved = await this.persistResume(
      content,
      dto.fileName,
      buffer.length,
    );
    return this.mapToDto(saved);
  }

  async findById(id: string): Promise<ResumeResponseDto> {
    this.validateUuid(id);
    const resume = await this.prisma.resume.findUnique({ where: { id } });
    if (!resume) {
      throw new HttpException('Currículo não encontrado', HttpStatus.NOT_FOUND);
    }
    return this.mapToDto(resume);
  }

  private decodeBase64(fileBase64: string): Buffer {
    const normalized = fileBase64.trim();
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
      throw new HttpException(
        'Base64 inválido',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    try {
      const buffer = Buffer.from(normalized, 'base64');
      if (buffer.length === 0) {
        throw new HttpException(
          'PDF inválido ou vazio',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      return buffer;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Base64 inválido',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  private async extractContent(dto: ProcessResumeDto): Promise<string> {
    try {
      return await this.resumeParserAgent.extractMarkdownFromPdf(dto);
    } catch {
      throw new HttpException(
        'Erro ao processar currículo com IA',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private ensureContentExtracted(content: string): void {
    if (content.trim().length === 0) {
      throw new HttpException(
        'A IA não conseguiu extrair conteúdo do PDF',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private async persistResume(
    content: string,
    fileName: string,
    fileSize: number,
  ): Promise<Resume> {
    return this.prisma.resume.create({
      data: {
        content,
        fileName,
        fileSize,
        language: 'pt',
      },
    });
  }

  private validateUuid(id: string): void {
    if (!UUID_PATTERN.test(id)) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }
  }

  private mapToDto(resume: Resume): ResumeResponseDto {
    return {
      id: resume.id,
      content: resume.content,
      fileName: resume.fileName,
      createdAt: resume.createdAt.toISOString(),
    };
  }
}
