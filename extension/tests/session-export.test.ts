import { buildSessionMarkdown, triggerDownload } from '../src/utils/session-export';

describe('session export', () => {
  it('builds markdown output', () => {
    const markdown = buildSessionMarkdown({
      id: '1',
      userId: 'user-1',
      platform: 'claude',
      title: 'Test session',
      entities: {
        projectName: 'ContextPassport',
        techStack: ['TypeScript'],
        files: ['src/app.tsx'],
        lastAction: 'Saved the popup',
        nextStep: 'Add tests',
      },
      messageCount: 2,
      tokenEstimate: 40,
      createdAt: '2026-04-08T00:00:00.000Z',
      updatedAt: '2026-04-08T00:00:00.000Z',
      expiresAt: null,
      tags: [],
      passport: {
        projectSummary: 'A browser extension',
        decisionsMade: ['Use React'],
        techStack: ['TypeScript'],
        filesMentioned: ['src/app.tsx'],
        lastAction: 'Saved popup',
        nextStep: 'Write tests',
        keyCodeContext: 'const app = true;',
        entities: {
          projectName: 'ContextPassport',
          techStack: ['TypeScript'],
          files: ['src/app.tsx'],
          lastAction: 'Saved popup',
          nextStep: 'Write tests',
        },
      },
      rawHistory: [{ role: 'user', content: 'hello' }],
    });

    expect(markdown).toContain('# Test session');
    expect(markdown).toContain('CONTEXT PASSPORT');
    expect(markdown).toContain('## Transcript');
  });

  it('triggers file downloads', () => {
    const click = jest.fn();
    Object.assign(URL, {
      createObjectURL: jest.fn(() => 'blob:test'),
      revokeObjectURL: jest.fn(),
    });
    const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({
      click,
      set href(value: string) {
        void value;
      },
      set download(value: string) {
        void value;
      },
    } as unknown as HTMLAnchorElement);
    triggerDownload('session.md', '# session', 'text/markdown');

    expect(click).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });
});
