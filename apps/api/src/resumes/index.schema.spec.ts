import { ProcessResumeSchema } from './index.schema';

describe('ProcessResumeSchema', () => {
  it('aceita payload válido', () => {
    const result = ProcessResumeSchema.safeParse({
      fileBase64: 'abc',
      fileName: 'cv.pdf',
    });

    expect(result.success).toBe(true);
  });

  it('rejeita sem fileBase64', () => {
    const result = ProcessResumeSchema.safeParse({
      fileName: 'cv.pdf',
    });

    expect(result.success).toBe(false);
  });

  it('rejeita sem fileName', () => {
    const result = ProcessResumeSchema.safeParse({
      fileBase64: 'abc',
    });

    expect(result.success).toBe(false);
  });

  it('rejeita fileBase64 que não é string', () => {
    const result = ProcessResumeSchema.safeParse({
      fileBase64: 123,
      fileName: 'cv.pdf',
    });

    expect(result.success).toBe(false);
  });

  it('rejeita fileBase64 vazio', () => {
    const result = ProcessResumeSchema.safeParse({
      fileBase64: '',
      fileName: 'cv.pdf',
    });

    expect(result.success).toBe(false);
  });

  it('rejeita fileName vazio', () => {
    const result = ProcessResumeSchema.safeParse({
      fileBase64: 'abc',
      fileName: '',
    });

    expect(result.success).toBe(false);
  });
});
