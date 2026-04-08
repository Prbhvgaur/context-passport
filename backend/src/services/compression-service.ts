import Anthropic from '@anthropic-ai/sdk';
import type { SessionMessage, SessionPassport } from '@context-passport/shared';
import { env } from '../config/env.js';

const systemPrompt = `You compress AI coding conversations into a structured JSON Session Passport.
Return only valid JSON with the exact keys:
projectSummary, decisionsMade, techStack, filesMentioned, lastAction, nextStep, keyCodeContext, entities.
The entities object must contain projectName, techStack, files, lastAction, nextStep.
Extract concrete decisions, active files, relevant snippets, and the next action to continue work.`;

const filePattern = /\b[\w./-]+\.(?:ts|tsx|js|jsx|json|md|css|html|py|java|go|rs|sql|yml|yaml)\b/g;
const techStackTerms = [
  'typescript',
  'javascript',
  'react',
  'next.js',
  'node.js',
  'express',
  'firebase',
  'firestore',
  'vercel',
  'tailwind',
  'jest',
  'chrome extension',
  'redis',
  'pnpm',
];

const collectUniqueMatches = (text: string, regex: RegExp) =>
  Array.from(new Set(text.match(regex) ?? [])).slice(0, 10);

const collectTechStack = (text: string) =>
  techStackTerms.filter((term) => text.toLowerCase().includes(term)).slice(0, 10);

const inferProjectName = (text: string) => {
  const file = collectUniqueMatches(text, filePattern)[0];
  if (file) {
    return file.split('/')[0] ?? 'Untitled project';
  }

  const firstSentence = text.split(/[.!?\n]/)[0]?.trim();
  return firstSentence && firstSentence.length > 4 ? firstSentence.slice(0, 80) : 'Untitled project';
};

const fallbackCompression = (messages: SessionMessage[]): SessionPassport => {
  const transcript = messages.map((message) => `${message.role}: ${message.content}`).join('\n');
  const files = collectUniqueMatches(transcript, filePattern);
  const techStack = collectTechStack(transcript);
  const assistantMessages = messages.filter((message) => message.role === 'assistant');
  const latestAssistant = assistantMessages.at(-1)?.content ?? messages.at(-1)?.content ?? 'No activity captured.';
  const latestUser = [...messages].reverse().find((message) => message.role === 'user')?.content ?? '';
  const summarySource = messages.slice(0, 4).map((message) => message.content).join(' ');

  return {
    projectSummary: summarySource.slice(0, 280) || 'Session summary unavailable.',
    decisionsMade: [
      assistantMessages[0]?.content.slice(0, 140) || 'Initial implementation strategy was discussed.',
      latestAssistant.slice(0, 140),
    ].filter((value): value is string => value.length > 0),
    techStack,
    filesMentioned: files,
    lastAction: latestAssistant.slice(0, 240),
    nextStep: latestUser.slice(0, 240) || 'Continue from the most recent unfinished task.',
    keyCodeContext: files.length > 0 ? `Relevant files: ${files.join(', ')}` : 'No code snippet captured.',
    entities: {
      projectName: inferProjectName(transcript),
      techStack,
      files,
      lastAction: latestAssistant.slice(0, 240),
      nextStep: latestUser.slice(0, 240) || 'Continue from the most recent unfinished task.',
    },
  };
};

export class CompressionService {
  private readonly anthropic = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

  public async compress(messages: SessionMessage[]): Promise<SessionPassport> {
    if (!this.anthropic) {
      return fallbackCompression(messages);
    }

    try {
      const transcript = messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join('\n\n');
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Compress this transcript into a Session Passport JSON object.\n\n${transcript}`,
          },
        ],
      });
      const textBlock = response.content.find((block) => block.type === 'text');
      const raw = textBlock?.text ?? '{}';

      return JSON.parse(raw) as SessionPassport;
    } catch {
      return fallbackCompression(messages);
    }
  }
}

