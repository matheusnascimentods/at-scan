import { LlmAgent, Runner } from '@google/adk';

import { FormatCheckerAgent } from './index.agent';

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

describe('FormatCheckerAgent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('checks Markdown formatting through ADK and parses format JSON', async () => {
    const output = {
      formatScore: 88,
      issues: [
        {
          severity: 'moderate',
          issue: 'Tables',
          description: 'Remova tabelas para melhorar a leitura por ATS.',
          pointsDeducted: 6,
        },
      ],
      issueCount: { critical: 0, moderate: 1, minor: 0 },
      passed: ['Contact info at top'],
    };
    mockRunEphemeral.mockReturnValue(events(JSON.stringify(output)));

    const result = await new FormatCheckerAgent().checkFormat(
      'resume markdown',
    );
    const message = mockRunEphemeral.mock.calls[0][0];

    expect(result).toEqual(output);
    expect(JSON.parse(message.newMessage.parts[0].text)).toEqual({
      resumeContent: 'resume markdown',
    });
    expect(LlmAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'FormatCheckerAgent',
        instruction: expect.stringContaining('Format Checker Agent'),
      }),
    );
    expect(Runner).toHaveBeenCalledTimes(1);
  });
});
