import type { SessionPassport, SessionSummary } from '@context-passport/shared';
import { formatPassport } from '@context-passport/shared';

export const buildSessionMarkdown = (
  session: SessionSummary & { passport: SessionPassport; rawHistory?: Array<{ role: string; content: string }> },
) => {
  const passport = formatPassport(session.platform, session.updatedAt, session.passport);
  const transcript = session.rawHistory
    ?.map((message: { role: string; content: string }) => `### ${message.role.toUpperCase()}\n\n${message.content}`)
    .join('\n\n');

  return `# ${session.title}\n\n${passport}\n\n${transcript ? `## Transcript\n\n${transcript}` : ''}`.trim();
};

export const triggerDownload = (filename: string, contents: string, mimeType: string) => {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
