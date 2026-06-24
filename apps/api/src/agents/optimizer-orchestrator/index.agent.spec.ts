import { Runner } from '@google/adk';

import { OrchestratorAgent } from '../orchestrator/index.agent';
import { ResumeOptimizerAgent } from '../resume-optimizer/index.agent';
import { OptimizerOrchestratorAgent } from './index.agent';

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

describe('OptimizerOrchestratorAgent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('analyzes, filters empty answers before optimization, and consolidates', async () => {
    const analyzeResult = analysis();
    const optimizerOutput = {
      optimizedContent: '# Resume otimizado',
      changes: [{ section: 'Skills', description: 'Adicionado Kubernetes.' }],
    };
    const response = {
      previousScore: 73,
      newScore: 91,
      gain: 18,
      optimizedContent: '# Resume otimizado',
      changes: optimizerOutput.changes,
    };
    const orchestrator = mockOrchestrator(analyzeResult);
    const optimizer = mockOptimizer(optimizerOutput);
    mockRunEphemeral.mockReturnValue(events(JSON.stringify(response)));

    const result = await new OptimizerOrchestratorAgent(
      orchestrator,
      optimizer,
    ).optimize({
      resumeContent: 'r'.repeat(100),
      jobDescription: 'j'.repeat(50),
      answers: [
        { tag: 'Containers', question: 'Conte.', answer: 'Usei Kubernetes.' },
        { tag: 'Cache', question: 'Conte.', answer: '   ' },
      ],
    });

    expect(result).toEqual(response);
    expect(optimizer.optimizeResume).toHaveBeenCalledWith(
      'r'.repeat(100),
      'j'.repeat(50),
      analyzeResult,
      [{ tag: 'Containers', question: 'Conte.', answer: 'Usei Kubernetes.' }],
    );
    expect(Runner).toHaveBeenCalledTimes(1);
  });
});

function analysis() {
  return {
    score: 73,
    breakdown: {
      keywordsScore: 70,
      semanticScore: 75,
      formatScore: 90,
      sectionScore: 80,
    },
    matchedKeywords: ['Node.js'],
    missingKeywords: ['Kubernetes'],
    formatIssues: ['Remova tabelas.'],
    recommendations: [
      {
        priority: 'Alta' as const,
        text: 'Inclua Kubernetes.',
        impact: '+6 pontos',
      },
    ],
    questions: [{ tag: 'Containers', text: 'Conte sobre Kubernetes.' }],
  };
}

function mockOrchestrator(
  output: ReturnType<typeof analysis>,
): OrchestratorAgent {
  return {
    analyze: jest.fn(async () => output),
  } as unknown as OrchestratorAgent;
}

function mockOptimizer(output: {
  optimizedContent: string;
  changes: { section: string; description: string }[];
}): ResumeOptimizerAgent {
  return {
    optimizeResume: jest.fn(async () => output),
  } as unknown as ResumeOptimizerAgent;
}
