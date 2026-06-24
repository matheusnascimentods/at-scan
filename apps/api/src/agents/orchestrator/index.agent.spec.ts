import { Runner } from '@google/adk';

import { FormatCheckerAgent } from '../format-checker/index.agent';
import { JobParserAgent } from '../job-parser/index.agent';
import { QuestionGeneratorAgent } from '../question-generator/index.agent';
import { ResumeParserAgent } from '../resume-parser/index.agent';
import { SemanticMatchAgent } from '../semantic-match/index.agent';
import { OrchestratorAgent } from './index.agent';

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

describe('OrchestratorAgent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('runs parsers first, match and format second, questions last', async () => {
    const calls: string[] = [];
    const resumeData = resumeOutput();
    const jobData = jobOutput();
    const matchData = semanticOutput();
    const formatData = formatOutput();
    const response = analyzeOutput([]);
    mockRunEphemeral.mockReturnValue(events(JSON.stringify(response)));

    const agent = new OrchestratorAgent(
      resumeParser(calls, resumeData),
      jobParser(calls, jobData),
      semanticMatcher(calls, matchData),
      formatChecker(calls, formatData),
      questionGenerator(calls),
    );

    const result = await agent.analyze({
      resumeContent: 'r'.repeat(100),
      jobDescription: 'j'.repeat(50),
    });

    expect(result.questions).toEqual([
      { tag: 'Containers', text: 'Conte sobre Kubernetes.' },
    ]);
    expect(calls).toEqual([
      'resume-parser',
      'job-parser',
      'semantic-match',
      'format-checker',
      'question-generator',
    ]);
    expect(Runner).toHaveBeenCalledTimes(1);
  });
});

function resumeOutput() {
  return {
    sections: [],
    allKeywords: ['Node.js'],
    totalKeywordCount: 1,
    contactAtTop: true,
    sectionScore: 80,
  };
}

function jobOutput() {
  return {
    jobTitle: 'Backend Developer',
    seniorityLevel: 'Mid' as const,
    domain: 'SaaS',
    mandatoryKeywords: [{ keyword: 'Kubernetes', weight: 3 }],
    preferredKeywords: [],
    coreResponsibilities: ['Build APIs'],
    allKeywords: ['Kubernetes'],
    totalKeywordCount: 1,
  };
}

function semanticOutput() {
  return {
    matchedKeywords: ['Node.js'],
    semanticMatches: [],
    missingKeywords: ['Kubernetes'],
    keywordsScore: 70,
    semanticScore: 75,
  };
}

function formatOutput() {
  return {
    formatScore: 90,
    issues: [],
    issueCount: { critical: 0, moderate: 0, minor: 0 },
    passed: ['No tables'],
  };
}

function analyzeOutput(questions: { tag: string; text: string }[]) {
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
    formatIssues: [],
    recommendations: [
      { priority: 'Alta', text: 'Inclua Kubernetes.', impact: '+6 pontos' },
    ],
    questions,
  };
}

function resumeParser(
  calls: string[],
  output: ReturnType<typeof resumeOutput>,
): ResumeParserAgent {
  return {
    parseResume: jest.fn(async () => {
      calls.push('resume-parser');
      return output;
    }),
  } as unknown as ResumeParserAgent;
}

function jobParser(
  calls: string[],
  output: ReturnType<typeof jobOutput>,
): JobParserAgent {
  return {
    parseJob: jest.fn(async () => {
      calls.push('job-parser');
      return output;
    }),
  } as unknown as JobParserAgent;
}

function semanticMatcher(
  calls: string[],
  output: ReturnType<typeof semanticOutput>,
): SemanticMatchAgent {
  return {
    match: jest.fn(async () => {
      calls.push('semantic-match');
      return output;
    }),
  } as unknown as SemanticMatchAgent;
}

function formatChecker(
  calls: string[],
  output: ReturnType<typeof formatOutput>,
): FormatCheckerAgent {
  return {
    checkFormat: jest.fn(async () => {
      calls.push('format-checker');
      return output;
    }),
  } as unknown as FormatCheckerAgent;
}

function questionGenerator(calls: string[]): QuestionGeneratorAgent {
  return {
    generateQuestions: jest.fn(async () => {
      calls.push('question-generator');
      return {
        questions: [{ tag: 'Containers', text: 'Conte sobre Kubernetes.' }],
      };
    }),
  } as unknown as QuestionGeneratorAgent;
}
