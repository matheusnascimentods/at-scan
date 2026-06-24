import { LlmAgent, Runner } from '@google/adk';

import { ResumeOptimizerAgent } from './index.agent';

const mockRunEphemeral = jest.fn<
  (params: Parameters<Runner['runEphemeral']>[0]) => AsyncGenerator<{ text: string }>
>();

jest.mock('@google/adk', () => ({
  InMemorySessionService: jest.fn(),
  LlmAgent: jest.fn(),
  Runner: jest
    .fn()
    .mockImplementation(() => ({ runEphemeral: mockRunEphemeral })),
  stringifyContent: jest.fn((event: { text: string }) => event.text),
}));

async function* events(text: string) {
  await Promise.resolve();
  yield { text };
}

describe('ResumeOptimizerAgent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends only optimization context and parses optimized resume JSON', async () => {
    const analyzeResult = {
      score: 73,
      breakdown: {
        keywordsScore: 70,
        semanticScore: 75,
        formatScore: 90,
        sectionScore: 60,
      },
      matchedKeywords: ['Node.js'],
      missingKeywords: ['Kubernetes'],
      formatIssues: ['Remova tabelas.'],
      recommendations: [
        { priority: 'Alta', text: 'Inclua Kubernetes.', impact: '+6 pontos' },
      ],
      questions: [{ tag: 'Containers', text: 'Conte sobre containers.' }],
    };
    const answers = [
      { tag: 'Containers', question: 'Conte.', answer: 'Usei Kubernetes.' },
    ];
    const output = {
      optimizedContent: '# Resume\n- Usei Kubernetes.',
      changes: [
        {
          section: 'Skills',
          description: 'Adicionado Kubernetes com base na resposta.',
        },
      ],
    };
    mockRunEphemeral.mockReturnValue(events(JSON.stringify(output)));

    const result = await new ResumeOptimizerAgent().optimizeResume(
      'resume markdown',
      'job description',
      analyzeResult,
      answers,
    );
    const message = mockRunEphemeral.mock.calls[0][0];

    expect(result).toEqual(output);
    expect(JSON.parse(message.newMessage.parts[0].text)).toEqual({
      resumeContent: 'resume markdown',
      jobDescription: 'job description',
      missingKeywords: ['Kubernetes'],
      recommendations: analyzeResult.recommendations,
      answers,
      formatIssues: ['Remova tabelas.'],
    });
    expect(LlmAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ResumeOptimizerAgent',
        instruction: expect.stringContaining('Resume Optimizer Agent'),
      }),
    );
    expect(Runner).toHaveBeenCalledTimes(1);
  });
});
