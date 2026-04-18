import type { IncomingMessage } from 'node:http';

const appName = 'ContextPassport';
const repositoryUrl = 'https://github.com/Prbhvgaur/context-passport';
const extensionDownloadUrl =
  'https://github.com/Prbhvgaur/context-passport/releases/download/v1.0.0/context-passport-extension-v1.0.0.zip';

const getHeaderValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export const getRequestOrigin = (req: IncomingMessage) => {
  const host = getHeaderValue(req.headers.host) ?? 'context-passport-api.vercel.app';
  const forwardedProto = getHeaderValue(req.headers['x-forwarded-proto']);
  const protocol = forwardedProto ?? 'https';
  return `${protocol}://${host}`;
};

export const buildOpenApiSpec = (origin: string) => {
  return {
    openapi: '3.0.3',
    info: {
      title: `${appName} API`,
      version: '1.0.0',
      description:
        'Production API for capturing, compressing, storing, and restoring AI session context across major AI platforms.',
    },
    servers: [
      {
        url: `${origin}/api/v1`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          responses: {
            '200': {
              description: 'Service is healthy.',
            },
          },
        },
      },
      '/sessions': {
        get: {
          summary: 'List sessions for the authenticated user',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Session list returned.' },
            '401': { description: 'Authorization missing or invalid.' },
          },
        },
        post: {
          summary: 'Save a new session passport',
          security: [{ bearerAuth: [] }],
          responses: {
            '201': { description: 'Session created.' },
            '401': { description: 'Authorization missing or invalid.' },
          },
        },
      },
      '/sessions/{id}': {
        get: {
          summary: 'Get a single session by ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Session returned.' },
            '404': { description: 'Session not found.' },
          },
        },
        put: {
          summary: 'Update a session',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Session updated.' },
          },
        },
        delete: {
          summary: 'Delete a session',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '204': { description: 'Session deleted.' },
          },
        },
      },
      '/sessions/{id}/resume': {
        post: {
          summary: 'Generate a resume prompt for a session',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Resume prompt generated.' },
          },
        },
      },
      '/sessions/compress': {
        post: {
          summary: 'Compress a transcript into a session passport',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Compression completed.' },
          },
        },
      },
      '/user/profile': {
        get: {
          summary: 'Get the authenticated user profile and usage stats',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Profile returned.' },
            '401': { description: 'Authorization missing or invalid.' },
          },
        },
      },
      '/user/preferences': {
        put: {
          summary: 'Update authenticated user preferences',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Preferences updated.' },
          },
        },
      },
    },
    externalDocs: {
      description: 'GitHub repository',
      url: repositoryUrl,
    },
  };
};

export const renderDocsHtml = (origin: string) => {
  const specUrl = `${origin}/api/openapi`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${appName} API Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #020617; }
      .topbar { display: none; }
      .swagger-ui .info { margin: 24px 0; }
      .swagger-ui .scheme-container { box-shadow: none; background: #e2e8f0; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: ${JSON.stringify(specUrl)},
          dom_id: '#swagger-ui',
          deepLinking: true,
          docExpansion: 'list',
          defaultModelsExpandDepth: 1,
          persistAuthorization: true
        });
      };
    </script>
  </body>
</html>`;
};
