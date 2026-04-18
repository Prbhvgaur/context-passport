import type { IncomingMessage, ServerResponse } from 'node:http';
import { getRequestOrigin } from '../../src/public-site.js';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  const origin = getRequestOrigin(req);

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(
    JSON.stringify({
      success: true,
      data: {
        name: 'ContextPassport API v1',
        docs: `${origin}/api/docs`,
        openapi: `${origin}/api/openapi`,
        endpoints: {
          health: `${origin}/api/v1/health`,
          sessions: `${origin}/api/v1/sessions`,
          compress: `${origin}/api/v1/sessions/compress`,
          profile: `${origin}/api/v1/user/profile`,
          preferences: `${origin}/api/v1/user/preferences`,
        },
        note: 'Protected routes require a Bearer token. Public docs and health remain open.',
      },
    }),
  );
}
