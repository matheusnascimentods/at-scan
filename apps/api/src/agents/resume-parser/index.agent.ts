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
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';

@Injectable()
export class ResumeParserAgent {
  async parseResume(resumeContent: string): Promise<ResumeParserOutputDto> {
    const parsed = await this.run({ resumeContent });

    return ResumeParserOutputSchema.parse(parsed);
  }

  private buildRunner(): Runner {
    const agent = new LlmAgent({
      name: 'ResumeParserAgent',
      model: MODEL,
      instruction: PROMPT,
    });

    return new Runner({
      appName: 'ats-resume-parser',
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
