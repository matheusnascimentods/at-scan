import { LlmAgent, Runner } from '@google/adk';

import { SemanticMatchAgent } from './index.agent';

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

describe('SemanticMatchAgent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('compares parser outputs through ADK and parses match JSON', async () => {
    const resumeData = {
      sections: [],
      allKeywords: ['PostgreSQL'],
      totalKeywordCount: 1,
      contactAtTop: true,
      sectionScore: 80,
    };
    const jobData = {
      jobTitle: 'Backend Developer',
      seniorityLevel: 'Mid',
      domain: 'SaaS',
      mandatoryKeywords: [{ keyword: 'PostgreSQL', weight: 3 }],
      preferredKeywords: [],
      coreResponsibilities: ['Build APIs'],
      allKeywords: ['PostgreSQL'],
      totalKeywordCount: 1,
    };
    const output = {
      matchedKeywords: ['PostgreSQL'],
      semanticMatches: [],
      missingKeywords: [],
      keywordsScore: 100,
      semanticScore: 90,
    };
    mockRunEphemeral.mockReturnValue(events(JSON.stringify(output)));

    const result = await new SemanticMatchAgent().match(resumeData, jobData);
    const message = mockRunEphemeral.mock.calls[0][0];

    expect(result).toEqual(output);
    expect(JSON.parse(message.newMessage.parts[0].text)).toEqual({
      resumeData,
      jobData,
    });
    expect(LlmAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'SemanticMatchAgent',
        instruction: expect.stringContaining('Semantic Match Agent'),
      }),
    );
    expect(Runner).toHaveBeenCalledTimes(1);
  });
});
