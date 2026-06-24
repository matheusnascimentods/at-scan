import { LlmAgent, Runner } from '@google/adk';

import { JobParserAgent } from './index.agent';

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

describe('JobParserAgent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads its prompt, calls ADK, and parses job JSON', async () => {
    const output = {
      jobTitle: 'Senior Backend Developer',
      seniorityLevel: 'Senior',
      domain: 'SaaS',
      mandatoryKeywords: [{ keyword: 'Node.js', weight: 3 }],
      preferredKeywords: [{ keyword: 'Docker', weight: 1 }],
      coreResponsibilities: ['Build APIs'],
      allKeywords: ['Node.js', 'Docker'],
      totalKeywordCount: 2,
    };
    mockRunEphemeral.mockReturnValue(events(JSON.stringify(output)));

    const result = await new JobParserAgent().parseJob('job description');
    const message = mockRunEphemeral.mock.calls[0][0];

    expect(result).toEqual(output);
    expect(JSON.parse(message.newMessage.parts[0].text)).toEqual({
      jobDescription: 'job description',
    });
    expect(LlmAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'JobParserAgent',
        instruction: expect.stringContaining('Job Parser Agent'),
      }),
    );
    expect(Runner).toHaveBeenCalledTimes(1);
  });
});
