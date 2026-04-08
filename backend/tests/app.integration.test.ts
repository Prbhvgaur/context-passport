import request from 'supertest';
import { createApp } from '../src/app';

const authHeaders = {
  Authorization: 'Bearer test-token',
  'x-test-user-id': 'user-1',
  'x-test-user-email': 'user@example.com',
  'x-test-user-name': 'Test User',
};

describe('ContextPassport API', () => {
  it('returns health information', async () => {
    const app = createApp();
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('creates, lists, gets, updates, resumes, and deletes sessions', async () => {
    const app = createApp();
    const createResponse = await request(app)
      .post('/api/v1/sessions')
      .set(authHeaders)
      .send({
        platform: 'chatgpt',
        title: 'Frontend dashboard',
        rawHistory: [
          { role: 'user', content: 'Build a dashboard in src/app.tsx' },
          { role: 'assistant', content: 'We added charts and Firebase auth.' },
        ],
        messageCount: 2,
        tokenEstimate: 40,
        tags: ['dashboard'],
      });

    expect(createResponse.status).toBe(201);
    const sessionId = createResponse.body.data.id as string;

    const listResponse = await request(app).get('/api/v1/sessions').set(authHeaders);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.items).toHaveLength(1);

    const getResponse = await request(app).get(`/api/v1/sessions/${sessionId}`).set(authHeaders);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.title).toBe('Frontend dashboard');

    const updateResponse = await request(app)
      .put(`/api/v1/sessions/${sessionId}`)
      .set(authHeaders)
      .send({
        title: 'Frontend dashboard v2',
        tags: ['dashboard', 'react'],
      });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.title).toBe('Frontend dashboard v2');

    const resumeResponse = await request(app)
      .post(`/api/v1/sessions/${sessionId}/resume`)
      .set(authHeaders);
    expect(resumeResponse.status).toBe(200);
    expect(resumeResponse.body.data.prompt).toContain('CONTEXT PASSPORT');

    const profileResponse = await request(app).get('/api/v1/user/profile').set(authHeaders);
    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.data.email).toBe('user@example.com');

    const preferenceResponse = await request(app)
      .put('/api/v1/user/preferences')
      .set(authHeaders)
      .send({
        autoCapture: false,
        compressionLevel: 'thorough',
      });
    expect(preferenceResponse.status).toBe(200);
    expect(preferenceResponse.body.data.preferences.autoCapture).toBe(false);

    const deleteResponse = await request(app).delete(`/api/v1/sessions/${sessionId}`).set(authHeaders);
    expect(deleteResponse.status).toBe(204);
  });

  it('enforces the rate limiter', async () => {
    const app = createApp();
    let response = await request(app).get('/api/v1/health');
    for (let index = 0; index < 100; index += 1) {
      response = await request(app).get('/api/v1/health');
    }

    expect(response.status).toBe(429);
  });
});
