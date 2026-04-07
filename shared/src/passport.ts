import { PASSPORT_DIVIDER, PASSPORT_SECTION_DIVIDER } from './constants';
import type { SessionPassport, SupportedPlatform } from './types';

export const formatPassport = (
  platform: SupportedPlatform,
  date: string,
  passport: SessionPassport,
) => {
  return [
    PASSPORT_DIVIDER,
    'CONTEXT PASSPORT - ContextPassport',
    PASSPORT_DIVIDER,
    `Previous Platform: ${platform}`,
    `Session Date: ${date}`,
    `Project: ${passport.entities.projectName}`,
    PASSPORT_SECTION_DIVIDER,
    'WHAT WE BUILT:',
    passport.projectSummary,
    '',
    'DECISIONS MADE:',
    ...passport.decisionsMade.map((decision) => `• ${decision}`),
    '',
    `TECH STACK: ${passport.techStack.join(', ') || 'Not captured'}`,
    `FILES MENTIONED: ${passport.filesMentioned.join(', ') || 'None'}`,
    '',
    'WHERE WE LEFT OFF:',
    passport.lastAction,
    '',
    'NEXT STEP:',
    passport.nextStep,
    '',
    'KEY CODE CONTEXT:',
    passport.keyCodeContext || 'No code snippet captured.',
    PASSPORT_DIVIDER,
    'Please continue exactly from where we left off.',
    PASSPORT_DIVIDER,
  ].join('\n');
};

