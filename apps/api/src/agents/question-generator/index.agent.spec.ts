import { LlmAgent, Runner } from '@google/adk';

import { QuestionGeneratorAgent } from './index.agent';

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

describe('QuestionGeneratorAgent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends missing keywords and job context, then parses 3-5 questions', async () => {
    const jobData = {
      jobTitle: 'Backend Developer',
      seniorityLevel: 'Mid',
      domain: 'SaaS',
      mandatoryKeywords: [],
      preferredKeywords: [],
      coreResponsibilities: ['Build APIs'],
      allKeywords: ['Kubernetes'],
      totalKeywordCount: 1,
    };
    const output = {
      questions: [
        { tag: 'Containers', text: 'Conte sobre Kubernetes.' },
        { tag: 'Cloud', text: 'Conte sobre cloud.' },
        { tag: 'Conquistas', text: 'Quais números você pode incluir?' },
      ],
    };
    mockRunEphemeral.mockReturnValue(events(JSON.stringify(output)));

    const result = await new QuestionGeneratorAgent().generateQuestions(
      ['Kubernetes'],
      jobData,
    );
    const message = mockRunEphemeral.mock.calls[0][0];

    expect(result).toEqual(output);
    expect(JSON.parse(message.newMessage.parts[0].text)).toEqual({
      missingKeywords: ['Kubernetes'],
      jobTitle: 'Backend Developer',
      coreResponsibilities: ['Build APIs'],
    });
    expect(LlmAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'QuestionGeneratorAgent',
        instruction: expect.stringContaining('Question Generator Agent'),
      }),
    );
    expect(Runner).toHaveBeenCalledTimes(1);
  });
});
