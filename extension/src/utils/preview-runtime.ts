import {
  APP_NAME,
  DEFAULT_PREFERENCES,
  formatPassport,
} from '@context-passport/shared';
import type {
  SessionPassport,
  SessionSummary,
  UserPreferences,
  UserProfile,
} from '@context-passport/shared';

export interface PreviewAuthPayload {
  idToken: string;
  profile: UserProfile;
}

export interface PreviewAppState {
  user: UserProfile | null;
  sessions: SessionSummary[];
  preferences: UserPreferences;
}

export interface PreviewSessionDetail extends SessionSummary {
  passport: SessionPassport;
  rawHistory: Array<{ role: string; content: string }>;
}

interface PreviewState {
  token: string | null;
  user: UserProfile | null;
  preferences: UserPreferences;
  sessions: PreviewSessionDetail[];
}

const PREVIEW_STORAGE_KEY = 'context-passport.preview-state';

const previewUser: UserProfile = {
  userId: 'preview-user',
  email: 'founder@contextpassport.app',
  displayName: 'Ava Chen',
  photoURL: 'https://api.dicebear.com/9.x/glass/svg?seed=ContextPassport',
  createdAt: '2026-04-02T08:00:00.000Z',
  lastActiveAt: '2026-04-09T12:50:00.000Z',
  totalSessions: 12,
  totalResumes: 27,
  preferences: DEFAULT_PREFERENCES,
};

const previewSessions: PreviewSessionDetail[] = [
  {
    id: 'preview-1',
    userId: previewUser.userId,
    platform: 'claude',
    title: 'ContextPassport launch narrative and onboarding flows',
    entities: {
      projectName: 'ContextPassport Marketing Site',
      techStack: ['Next.js', 'Tailwind CSS', 'Framer Motion', 'Vercel'],
      files: ['app/page.tsx', 'components/hero.tsx', 'lib/copy.ts'],
      lastAction: 'Designed the hero narrative and tightened the onboarding promise around AI handoff moments.',
      nextStep: 'Turn the landing page into a conversion-ready story with proof, trust markers, and product flow screenshots.',
    },
    messageCount: 42,
    tokenEstimate: 13620,
    createdAt: '2026-04-07T06:40:00.000Z',
    updatedAt: '2026-04-09T11:15:00.000Z',
    expiresAt: null,
    tags: ['launch', 'marketing', 'conversion'],
    passport: {
      projectSummary:
        'We are shaping the launch narrative for ContextPassport, a cross-platform AI session handoff product. The work focused on clarifying the user pain, simplifying the promise, and structuring a landing page that feels credible and premium.',
      decisionsMade: [
        'Lead with the pain of losing context when switching AI tools or accounts.',
        'Show the extension as infrastructure for continuity, not another chat wrapper.',
        'Use proof-oriented sections instead of feature dumping.',
      ],
      techStack: ['Next.js', 'Tailwind CSS', 'Framer Motion', 'Vercel'],
      filesMentioned: ['app/page.tsx', 'components/hero.tsx', 'lib/copy.ts'],
      lastAction:
        'Refined the homepage story arc and aligned the hero copy with the product promise.',
      nextStep:
        'Build proof sections, founder credibility, and a step-by-step product flow block.',
      keyCodeContext:
        "export const heroPromise = 'Resume any AI project without losing the thread.';",
      entities: {
        projectName: 'ContextPassport Marketing Site',
        techStack: ['Next.js', 'Tailwind CSS', 'Framer Motion', 'Vercel'],
        files: ['app/page.tsx', 'components/hero.tsx', 'lib/copy.ts'],
        lastAction: 'Refined the homepage story arc and aligned the hero copy with the product promise.',
        nextStep: 'Build proof sections, founder credibility, and a step-by-step product flow block.',
      },
    },
    rawHistory: [
      { role: 'user', content: 'I want the homepage to feel premium and urgent, not generic SaaS.' },
      {
        role: 'assistant',
        content:
          'Let’s anchor the story around continuity: losing context is the tax, ContextPassport removes it.',
      },
    ],
  },
  {
    id: 'preview-2',
    userId: previewUser.userId,
    platform: 'chatgpt',
    title: 'Stripe subscription lifecycle for team billing',
    entities: {
      projectName: 'Team Billing Architecture',
      techStack: ['Node.js', 'Stripe', 'Postgres', 'React'],
      files: ['billing/webhooks.ts', 'db/subscriptions.sql', 'app/settings/billing.tsx'],
      lastAction:
        'Mapped subscription events to entitlement updates and drafted webhook retry handling.',
      nextStep:
        'Implement proration-safe plan changes and expose billing state cleanly in the settings UI.',
    },
    messageCount: 31,
    tokenEstimate: 9820,
    createdAt: '2026-04-06T10:10:00.000Z',
    updatedAt: '2026-04-08T16:35:00.000Z',
    expiresAt: '2026-07-08T16:35:00.000Z',
    tags: ['payments', 'backend', 'entitlements'],
    passport: {
      projectSummary:
        'We designed a subscription and entitlement model for team billing using Stripe. The work covered lifecycle events, idempotent webhook handling, and how billing state should surface in the product UI.',
      decisionsMade: [
        'Treat Stripe as the billing source of truth and derive entitlements from persisted subscription state.',
        'Use webhook idempotency keys and replay-safe persistence for all billing events.',
        'Represent seat and plan changes separately from payment state in the UI.',
      ],
      techStack: ['Node.js', 'Stripe', 'Postgres', 'React'],
      filesMentioned: ['billing/webhooks.ts', 'db/subscriptions.sql', 'app/settings/billing.tsx'],
      lastAction:
        'Completed the webhook event map and outlined retry-safe synchronization rules.',
      nextStep:
        'Implement plan upgrades and downgrades with proration logic and richer billing settings states.',
      keyCodeContext:
        'await syncEntitlementsFromSubscription(subscription.id, event.id);',
      entities: {
        projectName: 'Team Billing Architecture',
        techStack: ['Node.js', 'Stripe', 'Postgres', 'React'],
        files: ['billing/webhooks.ts', 'db/subscriptions.sql', 'app/settings/billing.tsx'],
        lastAction: 'Completed the webhook event map and outlined retry-safe synchronization rules.',
        nextStep: 'Implement plan upgrades and downgrades with proration logic and richer billing settings states.',
      },
    },
    rawHistory: [
      { role: 'user', content: 'Make the Stripe setup resilient enough for real team billing.' },
      {
        role: 'assistant',
        content:
          'We should separate payment status from entitlement state so failures do not corrupt access rules.',
      },
    ],
  },
  {
    id: 'preview-3',
    userId: previewUser.userId,
    platform: 'perplexity',
    title: 'Internal copilots knowledge base retrieval strategy',
    entities: {
      projectName: 'Knowledge Retrieval System',
      techStack: ['Python', 'FastAPI', 'pgvector', 'OpenAI'],
      files: ['api/search.py', 'ingest/chunking.py', 'docs/retrieval-playbook.md'],
      lastAction:
        'Compared hybrid retrieval options and documented chunking rules for long engineering docs.',
      nextStep:
        'Benchmark retrieval quality across hybrid ranking, semantic search, and metadata filters.',
    },
    messageCount: 18,
    tokenEstimate: 6140,
    createdAt: '2026-04-05T07:00:00.000Z',
    updatedAt: '2026-04-09T09:45:00.000Z',
    expiresAt: '2026-05-09T09:45:00.000Z',
    tags: ['search', 'ai infra', 'experiments'],
    passport: {
      projectSummary:
        'We are building a knowledge retrieval layer for internal copilots. The focus was on chunking strategy, metadata design, and how to evaluate retrieval quality for technical documentation.',
      decisionsMade: [
        'Use hybrid retrieval as the default because semantic-only search misses exact technical anchors.',
        'Keep metadata opinionated so product and docs filters stay explainable.',
        'Evaluate on task completion quality, not retrieval score alone.',
      ],
      techStack: ['Python', 'FastAPI', 'pgvector', 'OpenAI'],
      filesMentioned: ['api/search.py', 'ingest/chunking.py', 'docs/retrieval-playbook.md'],
      lastAction:
        'Documented retrieval tradeoffs and selected the first benchmarking dimensions.',
      nextStep:
        'Run evaluation on real support questions and capture failure cases for ranking improvements.',
      keyCodeContext:
        'results = hybrid_rank(vector_hits=vector_hits, keyword_hits=keyword_hits, top_k=8)',
      entities: {
        projectName: 'Knowledge Retrieval System',
        techStack: ['Python', 'FastAPI', 'pgvector', 'OpenAI'],
        files: ['api/search.py', 'ingest/chunking.py', 'docs/retrieval-playbook.md'],
        lastAction: 'Documented retrieval tradeoffs and selected the first benchmarking dimensions.',
        nextStep: 'Run evaluation on real support questions and capture failure cases for ranking improvements.',
      },
    },
    rawHistory: [
      { role: 'user', content: 'I need retrieval quality that holds up for technical support workflows.' },
      {
        role: 'assistant',
        content:
          'We should benchmark on answer usefulness, not just whether the right chunk appears in the top results.',
      },
    ],
  },
];

const createInitialPreviewState = (): PreviewState => ({
  token: 'preview-token',
  user: previewUser,
  preferences: DEFAULT_PREFERENCES,
  sessions: previewSessions,
});

const safeLocalStorage = () => {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
};

const readState = (): PreviewState => {
  const storage = safeLocalStorage();
  const raw = storage?.getItem(PREVIEW_STORAGE_KEY);

  if (!raw) {
    const initialState = createInitialPreviewState();
    storage?.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(initialState));
    return initialState;
  }

  try {
    return JSON.parse(raw) as PreviewState;
  } catch {
    const initialState = createInitialPreviewState();
    storage?.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(initialState));
    return initialState;
  }
};

const writeState = (state: PreviewState) => {
  safeLocalStorage()?.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(state));
};

const toSummary = (session: PreviewSessionDetail): SessionSummary => {
  const { passport: _passport, rawHistory: _rawHistory, ...summary } = session;
  return summary;
};

const ok = <T>(data: T) => ({ success: true, data });

const createGeneratedSession = (user: UserProfile): PreviewSessionDetail => {
  const timestamp = new Date().toISOString();

  return {
    id: `preview-${crypto.randomUUID()}`,
    userId: user.userId,
    platform: 'grok',
    title: 'Captured browser preview session',
    entities: {
      projectName: `${APP_NAME} Demo Capture`,
      techStack: ['Chrome Extension', 'React', 'Express'],
      files: ['popup-app.tsx', 'options-app.tsx', 'background/index.ts'],
      lastAction: 'Triggered a manual save from the preview workspace.',
      nextStep: 'Resume the new session inside another AI tool and validate the handoff experience.',
    },
    messageCount: 9,
    tokenEstimate: 2410,
    createdAt: timestamp,
    updatedAt: timestamp,
    expiresAt: null,
    tags: ['demo', 'preview', 'capture'],
    passport: {
      projectSummary:
        'A manual capture was triggered inside the browser preview to demonstrate how ContextPassport stores resumable project context.',
      decisionsMade: [
        'Use preview mode to showcase the full interaction model without requiring Chrome APIs.',
        'Seed realistic sessions so the UI communicates value immediately.',
      ],
      techStack: ['Chrome Extension', 'React', 'Express'],
      filesMentioned: ['popup-app.tsx', 'options-app.tsx', 'background/index.ts'],
      lastAction: 'Triggered a manual save from the preview workspace.',
      nextStep: 'Resume the new session inside another AI tool and validate the handoff experience.',
      keyCodeContext: 'const previewMode = !isExtensionApiAvailable();',
      entities: {
        projectName: `${APP_NAME} Demo Capture`,
        techStack: ['Chrome Extension', 'React', 'Express'],
        files: ['popup-app.tsx', 'options-app.tsx', 'background/index.ts'],
        lastAction: 'Triggered a manual save from the preview workspace.',
        nextStep: 'Resume the new session inside another AI tool and validate the handoff experience.',
      },
    },
    rawHistory: [
      { role: 'user', content: 'Save this session so I can show the handoff flow in the browser preview.' },
      { role: 'assistant', content: 'Done. I created a fresh preview passport with resumable project context.' },
    ],
  };
};

export const createPreviewAuthPayload = (): PreviewAuthPayload => ({
  idToken: 'preview-token',
  profile: previewUser,
});

export const sendPreviewMessage = async <TResponse>(message: unknown): Promise<TResponse> => {
  const state = readState();
  const command = message as { type?: string; payload?: unknown };

  switch (command.type) {
    case 'GET_APP_STATE': {
      return ok<PreviewAppState>({
        user: state.user,
        sessions: state.sessions.map(toSummary),
        preferences: state.preferences,
      }) as TResponse;
    }
    case 'SET_AUTH': {
      const payload = command.payload as PreviewAuthPayload | undefined;
      state.token = payload?.idToken ?? 'preview-token';
      state.user = payload?.profile ?? previewUser;
      if (state.sessions.length === 0) {
        state.sessions = previewSessions;
      }
      writeState(state);
      return ok(state.user) as TResponse;
    }
    case 'FETCH_SESSIONS': {
      return ok(state.sessions.map(toSummary)) as TResponse;
    }
    case 'SAVE_ACTIVE_TAB_CHAT': {
      const user = state.user ?? previewUser;
      const session = createGeneratedSession(user);
      state.user = {
        ...user,
        totalSessions: state.sessions.length + 1,
        lastActiveAt: session.updatedAt,
      };
      state.sessions = [session, ...state.sessions];
      writeState(state);
      return ok(toSummary(session)) as TResponse;
    }
    case 'UPDATE_PREFERENCES': {
      const nextPreferences = {
        ...state.preferences,
        ...(command.payload as Partial<UserPreferences> | undefined),
      };
      state.preferences = nextPreferences;
      if (state.user) {
        state.user = {
          ...state.user,
          preferences: nextPreferences,
        };
      }
      writeState(state);
      return ok(state.user ?? previewUser) as TResponse;
    }
    case 'GET_SESSION_DETAIL': {
      const payload = command.payload as { id?: string } | undefined;
      const session = state.sessions.find((item) => item.id === payload?.id);
      if (!session) {
        throw new Error('Session not found in preview runtime.');
      }
      return ok(session) as TResponse;
    }
    case 'DELETE_SESSION': {
      const payload = command.payload as { id?: string } | undefined;
      state.sessions = state.sessions.filter((item) => item.id !== payload?.id);
      if (state.user) {
        state.user = {
          ...state.user,
          totalSessions: state.sessions.length,
        };
      }
      writeState(state);
      return ok(state.sessions.map(toSummary)) as TResponse;
    }
    case 'RESUME_SESSION': {
      const payload = command.payload as { id?: string } | undefined;
      const session = state.sessions.find((item) => item.id === payload?.id);
      if (!session) {
        throw new Error('Session not found in preview runtime.');
      }
      const passport = formatPassport(session.platform, session.updatedAt, session.passport);
      return ok(passport) as TResponse;
    }
    case 'LOG_OUT': {
      state.token = null;
      state.user = null;
      writeState(state);
      return ok(null) as TResponse;
    }
    default:
      throw new Error(`Preview runtime does not support message type "${String(command.type)}".`);
  }
};
