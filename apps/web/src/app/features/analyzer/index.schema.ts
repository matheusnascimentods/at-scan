import { z } from 'zod';

export const ProcessResumeSchema = z.object({
  fileBase64: z.string(),
  fileName: z.string(),
});
export type ProcessResumeDto = z.infer<typeof ProcessResumeSchema>;

export const ResumeResponseSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  createdAt: z.string(),
});
export type ResumeResponseDto = z.infer<typeof ResumeResponseSchema>;

export const AnalyzeRequestSchema = z.object({
  resumeContent: z.string().min(100),
  jobDescription: z.string().min(50),
});
export type AnalyzeRequestDto = z.infer<typeof AnalyzeRequestSchema>;

export const RecommendationSchema = z.object({
  priority: z.enum(['Alta', 'Média', 'Baixa']),
  text: z.string(),
  impact: z.string(),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

export const QuestionSchema = z.object({
  tag: z.string(),
  text: z.string(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const AnalyzeResponseSchema = z.object({
  score: z.number(),
  breakdown: z.object({
    keywordsScore: z.number(),
    semanticScore: z.number(),
    formatScore: z.number(),
    sectionScore: z.number(),
  }),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  formatIssues: z.array(z.string()),
  recommendations: z.array(RecommendationSchema),
  questions: z.array(QuestionSchema),
});
export type AnalyzeResponseDto = z.infer<typeof AnalyzeResponseSchema>;

export const AnswerSchema = z.object({
  tag: z.string(),
  question: z.string(),
  answer: z.string(),
});
export type Answer = z.infer<typeof AnswerSchema>;

export const OptimizeRequestSchema = z.object({
  resumeContent: z.string(),
  jobDescription: z.string(),
  answers: z.array(AnswerSchema),
});
export type OptimizeRequestDto = z.infer<typeof OptimizeRequestSchema>;

export const ChangeSchema = z.object({
  section: z.string(),
  description: z.string(),
});
export type Change = z.infer<typeof ChangeSchema>;

export const OptimizeResponseSchema = z.object({
  previousScore: z.number(),
  newScore: z.number(),
  gain: z.number(),
  optimizedContent: z.string(),
  changes: z.array(ChangeSchema),
});
export type OptimizeResponseDto = z.infer<typeof OptimizeResponseSchema>;
