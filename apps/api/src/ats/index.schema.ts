import { z } from 'zod';

export const AnalyzeRequestSchema = z.object({
  resumeId: z.string().uuid(),
  resumeContent: z.string().min(100),
  jobDescription: z.string().min(50),
});

export type AnalyzeRequestDto = z.infer<typeof AnalyzeRequestSchema>;

export const AnalyzeResponseSchema = z.object({
  id: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  breakdown: z.object({
    keywordsScore: z.number().int(),
    semanticScore: z.number().int(),
    formatScore: z.number().int(),
    sectionScore: z.number().int(),
  }),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  formatIssues: z.array(z.string()),
  recommendations: z.array(z.object({
    priority: z.enum(['Alta', 'Média', 'Baixa']),
    text: z.string(),
    impact: z.string(),
  })),
  questions: z.array(z.object({
    tag: z.string(),
    text: z.string(),
  })),
});

export type AnalyzeResponseDto = z.infer<typeof AnalyzeResponseSchema>;

export const OptimizeRequestSchema = z.object({
  analysisId: z.string().uuid(),
  answers: z.array(z.object({
    tag: z.string(),
    question: z.string(),
    answer: z.string(),
  })),
});

export type OptimizeRequestDto = z.infer<typeof OptimizeRequestSchema>;
export type OptimizeAnswerDto = OptimizeRequestDto['answers'][number];

export const OptimizeResponseSchema = z.object({
  id: z.string().uuid(),
  previousScore: z.number().int(),
  newScore: z.number().int(),
  gain: z.number().int(),
  optimizedContent: z.string(),
  changes: z.array(z.object({
    section: z.string(),
    description: z.string(),
  })),
});

export type OptimizeResponseDto = z.infer<typeof OptimizeResponseSchema>;

export const ResumeParserOutputSchema = z.object({
  sections: z.array(
    z.object({
      name: z.string(),
      originalName: z.string(),
      weight: z.number(),
      keywords: z.array(z.string()),
      hasQuantifiedAchievements: z.boolean(),
      bulletCount: z.number().int().min(0),
    }),
  ),
  allKeywords: z.array(z.string()),
  totalKeywordCount: z.number().int().min(0),
  contactAtTop: z.boolean(),
  sectionScore: z.number().int().min(0).max(100),
});

export const JobParserOutputSchema = z.object({
  jobTitle: z.string(),
  seniorityLevel: z.enum([
    'Junior',
    'Mid',
    'Senior',
    'Lead',
    'Principal',
    'Manager',
  ]),
  domain: z.string(),
  mandatoryKeywords: z.array(
    z.object({ keyword: z.string(), weight: z.number() }),
  ),
  preferredKeywords: z.array(
    z.object({ keyword: z.string(), weight: z.number() }),
  ),
  coreResponsibilities: z.array(z.string()),
  allKeywords: z.array(z.string()),
  totalKeywordCount: z.number().int().min(0),
});

export const SemanticMatchOutputSchema = z.object({
  matchedKeywords: z.array(z.string()),
  semanticMatches: z.array(
    z.object({
      jobKeyword: z.string(),
      resumeKeyword: z.string(),
      reason: z.string(),
    }),
  ),
  missingKeywords: z.array(z.string()),
  keywordsScore: z.number().int().min(0).max(100),
  semanticScore: z.number().int().min(0).max(100),
});

export const FormatCheckerOutputSchema = z.object({
  formatScore: z.number().int().min(0).max(100),
  issues: z.array(
    z.object({
      severity: z.enum(['critical', 'moderate', 'minor']),
      issue: z.string(),
      description: z.string(),
      pointsDeducted: z.number(),
    }),
  ),
  issueCount: z.object({
    critical: z.number().int().min(0),
    moderate: z.number().int().min(0),
    minor: z.number().int().min(0),
  }),
  passed: z.array(z.string()),
});

export const QuestionGeneratorOutputSchema = z.object({
  questions: z.array(z.object({
    tag: z.string(),
    text: z.string(),
  })).min(3).max(5),
});

export const ResumeOptimizerOutputSchema = z.object({
  optimizedContent: z.string(),
  changes: OptimizeResponseSchema.shape.changes,
});

export type ResumeParserOutputDto = z.infer<typeof ResumeParserOutputSchema>;
export type JobParserOutputDto = z.infer<typeof JobParserOutputSchema>;
export type SemanticMatchOutputDto = z.infer<typeof SemanticMatchOutputSchema>;
export type FormatCheckerOutputDto = z.infer<typeof FormatCheckerOutputSchema>;
export type QuestionGeneratorOutputDto = z.infer<
  typeof QuestionGeneratorOutputSchema
>;
export type ResumeOptimizerOutputDto = z.infer<
  typeof ResumeOptimizerOutputSchema
>;

