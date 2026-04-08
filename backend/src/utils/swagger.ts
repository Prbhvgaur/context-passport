import swaggerJSDoc from 'swagger-jsdoc';
import { env } from '../config/env.js';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ContextPassport API',
      version: '1.0.0',
      description: 'Secure session passport API for ContextPassport.',
    },
    servers: [
      {
        url: env.VITE_API_BASE_URL ?? `http://localhost:${env.PORT}`,
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
  },
  apis: ['src/routes/*.ts'],
});
