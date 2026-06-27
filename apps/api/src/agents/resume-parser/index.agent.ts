import { Injectable } from '@nestjs/common';
import {
  InMemorySessionService,
  LlmAgent,
  Runner,
  stringifyContent,
} from '@google/adk';
import * as fs from 'fs';

import {
  ResumeParserOutputDto,
  ResumeParserOutputSchema,
} from '../../ats/index.schema';

const PROMPT = fs.readFileSync(__dirname + '/index.prompt.md', 'utf-8');
const PDF_EXTRACTION_PROMPT = `
You are a resume extraction specialist.

Read the attached PDF resume and convert its content to clean Markdown.
Preserve the original information, section order, headings, bullet points,
contact details, dates, companies, roles, education, certifications, and skills.
Do not add, remove, rewrite, summarize, or improve content.
Respond only with Markdown.
`.trim();
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';

type PdfResumeInput = {
  fileBase64: string;
  fileName: string;
  mimeType?: string;
};

@Injectable()
export class ResumeParserAgent {
  async extractMarkdownFromPdf(input: PdfResumeInput): Promise<string> {
    const runner = this.buildRunner(
      PDF_EXTRACTION_PROMPT,
      'resume-pdf-extractor',
    );
    const response = await this.collectResponse(runner, this.pdfMessage(input));

    return response.trim();
  }

  async parseResume(resumeContent: string): Promise<ResumeParserOutputDto> {
    const parsed = await this.run({ resumeContent });

    return ResumeParserOutputSchema.parse(parsed);
  }

  private buildRunner(
    instruction = PROMPT,
    appName = 'ats-resume-parser',
  ): Runner {
    const agent = new LlmAgent({
      name: 'ResumeParserAgent',
      model: MODEL,
      instruction,
    });

    return new Runner({
      appName,
      agent,
      sessionService: new InMemorySessionService(),
    });
  }

  private async run(payload: object): Promise<unknown> {
    const runner = this.buildRunner();
    const response = await this.collectResponse(runner, this.message(payload));

    return JSON.parse(this.cleanJson(response));
  }

  private async collectResponse(
    runner: Runner,
    message: Parameters<Runner['runEphemeral']>[0],
  ): Promise<string> {
    let response = '';

    for await (const event of runner.runEphemeral(message)) {
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

  private pdfMessage(
    input: PdfResumeInput,
  ): Parameters<Runner['runEphemeral']>[0] {
    return {
      userId: 'ats-api',
      newMessage: {
        parts: [
          {
            text: `Convert this PDF resume to Markdown. File name: ${input.fileName}`,
          },
          {
            inlineData: {
              data: input.fileBase64,
              mimeType: input.mimeType ?? 'application/pdf',
            },
          },
        ],
      },
    } as Parameters<Runner['runEphemeral']>[0];
  }

  private cleanJson(text: string): string {
    return text
      .replace(/^```json\s*/u, '')
      .replace(/^```\s*/u, '')
      .replace(/\s*```$/u, '');
  }
}
