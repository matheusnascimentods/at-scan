import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { ResumesService } from './index.service';

type UploadedResumeFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

@Controller('resumes')
export class ResumesController {
  constructor(private readonly service: ResumesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  processResume(@UploadedFile() file: UploadedResumeFile | undefined) {
    if (!file) {
      throw new HttpException(
        'Arquivo PDF obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      file.mimetype !== 'application/pdf' &&
      !file.originalname.toLowerCase().endsWith('.pdf')
    ) {
      throw new HttpException(
        'Apenas arquivos PDF são permitidos',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.service.processResume({
      fileBase64: file.buffer.toString('base64'),
      fileName: file.originalname,
      mimeType: file.mimetype,
    });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
