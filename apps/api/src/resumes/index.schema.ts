import { z } from 'zod';

export const ProcessResumeSchema = z.object({
  fileBase64: z.string().min(1),
  fileName: z.string().min(1),
});

export type ProcessResumeDto = z.infer<typeof ProcessResumeSchema>;

export const ResumeResponseSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  fileName: z.string(),
  createdAt: z.string(),
});

export type ResumeResponseDto = z.infer<typeof ResumeResponseSchema>;

export type ResumeParserAgentPort = {
  run(input: ProcessResumeDto): Promise<string>;
};
