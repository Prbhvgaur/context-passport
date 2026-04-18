import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildOpenApiSpec, getRequestOrigin } from '../src/public-site.js';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  const origin = getRequestOrigin(req);

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(buildOpenApiSpec(origin)));
}
