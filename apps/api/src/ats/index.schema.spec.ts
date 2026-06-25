import {
  AnalyzeRequestSchema,
  OptimizeRequestSchema,
} from './index.schema';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const resumeContent = 'a'.repeat(100);
const jobDescription = 'b'.repeat(50);

describe('AnalyzeRequestSchema', () => {
  it('aceita payload válido', () => {
    const result = AnalyzeRequestSchema.safeParse({
      resumeId: VALID_UUID,
      resumeContent,
      jobDescription,
    });

    expect(result.success).toBe(true);
  });

  it('rejeita sem resumeId', () => {
    const result = AnalyzeRequestSchema.safeParse({
      resumeContent,
      jobDescription,
    });

    expect(result.success).toBe(false);
  });

  it('rejeita resumeId com formato inválido', () => {
    const result = AnalyzeRequestSchema.safeParse({
      resumeId: 'not-a-uuid',
      resumeContent,
      jobDescription,
    });

    expect(result.success).toBe(false);
  });

  it('rejeita resumeContent com 99 chars', () => {
    const result = AnalyzeRequestSchema.safeParse({
      resumeId: VALID_UUID,
      resumeContent: 'a'.repeat(99),
      jobDescription,
    });

    expect(result.success).toBe(false);
  });

  it('rejeita jobDescription com 49 chars', () => {
    const result = AnalyzeRequestSchema.safeParse({
      resumeId: VALID_UUID,
      resumeContent,
      jobDescription: 'b'.repeat(49),
    });

    expect(result.success).toBe(false);
  });

  it('rejeita campos ausentes', () => {
    expect(AnalyzeRequestSchema.safeParse({}).success).toBe(false);
    expect(
      AnalyzeRequestSchema.safeParse({ resumeId: VALID_UUID }).success,
    ).toBe(false);
  });
});

describe('OptimizeRequestSchema', () => {
  const validAnswer = {
    tag: 'Containers',
    question: 'Tem experiência com Kubernetes?',
    answer: 'Sim, em projetos pessoais.',
  };

  it('aceita payload válido', () => {
    const result = OptimizeRequestSchema.safeParse({
      analysisId: VALID_UUID,
      answers: [validAnswer],
    });

    expect(result.success).toBe(true);
  });

  it('aceita answers com answer vazio', () => {
    const result = OptimizeRequestSchema.safeParse({
      analysisId: VALID_UUID,
      answers: [{ ...validAnswer, answer: '' }],
    });

    expect(result.success).toBe(true);
  });

  it('rejeita sem analysisId', () => {
    const result = OptimizeRequestSchema.safeParse({
      answers: [validAnswer],
    });

    expect(result.success).toBe(false);
  });

  it('rejeita analysisId com formato inválido', () => {
    const result = OptimizeRequestSchema.safeParse({
      analysisId: 'invalid-id',
      answers: [validAnswer],
    });

    expect(result.success).toBe(false);
  });

  it('rejeita answers que não é array', () => {
    const result = OptimizeRequestSchema.safeParse({
      analysisId: VALID_UUID,
      answers: 'not-an-array',
    });

    expect(result.success).toBe(false);
  });

  it('rejeita item sem campo question', () => {
    const result = OptimizeRequestSchema.safeParse({
      analysisId: VALID_UUID,
      answers: [{ tag: 'Containers', answer: 'Sim' }],
    });

    expect(result.success).toBe(false);
  });

  it('rejeita item sem campo tag', () => {
    const result = OptimizeRequestSchema.safeParse({
      analysisId: VALID_UUID,
      answers: [{ question: 'Pergunta?', answer: 'Sim' }],
    });

    expect(result.success).toBe(false);
  });
});
