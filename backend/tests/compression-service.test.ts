import { CompressionService } from '../src/services/compression-service';

describe('CompressionService', () => {
  it('falls back to extractive summarization when no api key is configured', async () => {
    const service = new CompressionService();
    const passport = await service.compress([
      { role: 'user', content: 'Build a React TypeScript dashboard in src/app.tsx using Firebase and Vercel.' },
      { role: 'assistant', content: 'We decided to use Tailwind and keep auth in firebase.ts.' },
      { role: 'user', content: 'Next update the popup UI and extension background worker.' },
    ]);

    expect(passport.entities.projectName.length).toBeGreaterThan(0);
    expect(passport.techStack).toContain('react');
    expect(passport.nextStep.toLowerCase()).toContain('update the popup ui');
  });
});
