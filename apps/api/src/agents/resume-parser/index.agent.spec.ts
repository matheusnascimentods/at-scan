import { LlmAgent, Runner } from '@google/adk';

import { ResumeParserAgent } from './index.agent';

const mockRunEphemeral =
  jest.fn<
    (
      params: Parameters<Runner['runEphemeral']>[0],
    ) => AsyncGenerator<{ text: string }>
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

describe('ResumeParserAgent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('extracts Markdown from PDF using inlineData', async () => {
    mockRunEphemeral.mockReturnValue(events('# Curriculo'));

    const result = await new ResumeParserAgent().extractMarkdownFromPdf({
      fileBase64: 'JVBERi0xLjQ=',
      fileName: 'curriculo.pdf',
      mimeType: 'application/pdf',
    });
    const message = mockRunEphemeral.mock.calls[0][0];

    expect(result).toBe('# Curriculo');
    expect(message.newMessage.parts).toEqual([
      { text: 'Convert this PDF resume to Markdown. File name: curriculo.pdf' },
      {
        inlineData: {
          data: 'JVBERi0xLjQ=',
          mimeType: 'application/pdf',
        },
      },
    ]);
    expect(LlmAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ResumeParserAgent',
        instruction: expect.stringContaining('resume extraction specialist'),
      }),
    );
  });

  it('loads its prompt, calls ADK, and parses resume JSON', async () => {
    const output = {
      sections: [
        {
          name: 'Skills',
          originalName: 'Skills',
          weight: 25,
          keywords: ['TypeScript'],
          hasQuantifiedAchievements: false,
          bulletCount: 1,
        },
      ],
      allKeywords: ['TypeScript'],
      totalKeywordCount: 1,
      contactAtTop: true,
      sectionScore: 80,
    };
    mockRunEphemeral.mockReturnValue(events(JSON.stringify(output)));

    const result = await new ResumeParserAgent().parseResume('resume markdown');
    const message = mockRunEphemeral.mock.calls[0][0];

    expect(result).toEqual(output);
    expect(JSON.parse(message.newMessage.parts[0].text)).toEqual({
      resumeContent: 'resume markdown',
    });
    expect(LlmAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ResumeParserAgent',
        instruction: expect.stringContaining('Resume Parser Agent'),
      }),
    );
    expect(Runner).toHaveBeenCalledTimes(1);
  });
});
