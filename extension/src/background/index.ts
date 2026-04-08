import type {
  CreateSessionInput,
  SessionPassport,
  SessionSummary,
  SupportedPlatform,
  UserPreferences,
  UserProfile,
} from '@context-passport/shared';
import {
  queryActiveTab,
  sendMessageToTab,
} from '../utils/chrome';
import {
  clearStoredToken,
  clearStoredUser,
  readPreferences,
  readStoredSessions,
  readStoredToken,
  readStoredUser,
  writePreferences,
  writeStoredToken,
  writeStoredSessions,
  writeStoredUser,
} from '../utils/storage';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface CapturedSession {
  platform: SupportedPlatform;
  title: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  limitDetected: boolean;
}

interface ContentLimitDetectedMessage {
  type: 'CONTENT_LIMIT_DETECTED';
  payload: CapturedSession;
}

interface GetAppStateMessage {
  type: 'GET_APP_STATE';
}

interface SetAuthMessage {
  type: 'SET_AUTH';
  payload: {
    idToken: string;
    profile: UserProfile;
  };
}

interface LogOutMessage {
  type: 'LOG_OUT';
}

interface FetchSessionsMessage {
  type: 'FETCH_SESSIONS';
}

interface SaveActiveTabChatMessage {
  type: 'SAVE_ACTIVE_TAB_CHAT';
}

interface DeleteSessionMessage {
  type: 'DELETE_SESSION';
  payload: {
    id: string;
  };
}

interface UpdatePreferencesMessage {
  type: 'UPDATE_PREFERENCES';
  payload: Partial<UserPreferences>;
}

interface ResumeSessionMessage {
  type: 'RESUME_SESSION';
  payload: {
    id: string;
  };
}

interface GetSessionDetailMessage {
  type: 'GET_SESSION_DETAIL';
  payload: {
    id: string;
  };
}

type BackgroundMessage =
  | ContentLimitDetectedMessage
  | GetAppStateMessage
  | SetAuthMessage
  | LogOutMessage
  | FetchSessionsMessage
  | SaveActiveTabChatMessage
  | DeleteSessionMessage
  | UpdatePreferencesMessage
  | ResumeSessionMessage
  | GetSessionDetailMessage;

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readViteEnv = (key: string) => {
  const value: unknown = import.meta.env[key];
  return typeof value === 'string' ? value : undefined;
};

const isBackgroundMessage = (value: unknown): value is BackgroundMessage =>
  isObjectRecord(value) && typeof value['type'] === 'string';

const apiBaseUrl = readViteEnv('VITE_API_BASE_URL') ?? 'http://localhost:3000';

const retry = async <T>(operation: () => Promise<T>, attempts = 3): Promise<T> => {
  let lastError: unknown;
  for (let index = 0; index < attempts; index += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** index));
    }
  }

  throw lastError;
};

const apiFetch = async <T>(path: string, init?: RequestInit) => {
  const token = await readStoredToken();
  if (!token) {
    throw new Error('Not authenticated.');
  }

  const response = await retry(() =>
    fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    }),
  );

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return (await response.json()) as ApiResponse<T>;
};

const syncBadge = async () => {
  const sessions = await readStoredSessions();
  await chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
  await chrome.action.setBadgeText({ text: sessions.length ? String(sessions.length) : '' });
};

const inferExpiry = (preferences: UserPreferences) => {
  if (preferences.sessionExpiryDays === -1) {
    return null;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + preferences.sessionExpiryDays);
  return nextDate.toISOString();
};

const captureFromTab = async () => {
  const tab = await queryActiveTab();
  if (!tab?.id) {
    throw new Error('No active tab found.');
  }

  const capture = await sendMessageToTab<CapturedSession>(tab.id, { type: 'CAPTURE_SESSION' });
  return capture;
};

const refreshSessions = async () => {
  const response = await apiFetch<{ items: SessionSummary[]; nextCursor: string | null }>('/api/v1/sessions');
  await writeStoredSessions(response.data.items);
  await syncBadge();
  return response.data.items;
};

const saveCapturedSession = async (capture: CapturedSession) => {
  const preferences = await readPreferences();
  const payload: CreateSessionInput = {
    platform: capture.platform,
    title: capture.title || `${capture.platform} session`,
    rawHistory: capture.messages,
    messageCount: capture.messages.length,
    tokenEstimate: Math.round(
      capture.messages.reduce((total, message) => total + message.content.length, 0) / 4,
    ),
    tags: [],
    expiresAt: inferExpiry(preferences),
  };

  const response = await apiFetch<{ id: string; passport: SessionPassport } | SessionSummary>(
    '/api/v1/sessions',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  await refreshSessions();
  return response.data;
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'context-passport-save',
    title: 'Save to ContextPassport',
    contexts: ['all'],
  });
  void syncBadge();
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'context-passport-save') {
    void captureFromTab().then(saveCapturedSession);
  }
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    void syncBadge();
  }
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isBackgroundMessage(message)) {
    return false;
  }

  if (message.type === 'CONTENT_LIMIT_DETECTED') {
    void (async () => {
      const preferences = await readPreferences();
      if (!preferences.autoCapture || preferences.autoCaptureTrigger !== 'limit-detected') {
        sendResponse({ success: true, skipped: true });
        return;
      }

      const result = await saveCapturedSession(message.payload);
      sendResponse({ success: true, data: result });
    })();
    return true;
  }

  if (message.type === 'GET_APP_STATE') {
    void (async () => {
      const [user, sessions, preferences] = await Promise.all([
        readStoredUser(),
        readStoredSessions(),
        readPreferences(),
      ]);
      sendResponse({ success: true, data: { user, sessions, preferences } });
    })();
    return true;
  }

  if (message.type === 'SET_AUTH') {
    void (async () => {
      await writeStoredUser(message.payload.profile);
      await writeStoredToken(message.payload.idToken);
      const profileResponse = await apiFetch<UserProfile>('/api/v1/user/profile');
      await writeStoredUser(profileResponse.data);
      sendResponse({ success: true, data: profileResponse.data });
    })();
    return true;
  }

  if (message.type === 'LOG_OUT') {
    void (async () => {
      await Promise.all([clearStoredToken(), clearStoredUser(), writeStoredSessions([])]);
      await syncBadge();
      sendResponse({ success: true });
    })();
    return true;
  }

  if (message.type === 'FETCH_SESSIONS') {
    void refreshSessions()
      .then((sessions) => sendResponse({ success: true, data: sessions }))
      .catch((error: Error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'SAVE_ACTIVE_TAB_CHAT') {
    void captureFromTab()
      .then(saveCapturedSession)
      .then((data) => sendResponse({ success: true, data }))
      .catch((error: Error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'DELETE_SESSION') {
    void (async () => {
      await apiFetch(`/api/v1/sessions/${message.payload.id}`, { method: 'DELETE' });
      const sessions = await refreshSessions();
      sendResponse({ success: true, data: sessions });
    })();
    return true;
  }

  if (message.type === 'UPDATE_PREFERENCES') {
    void (async () => {
      const current = await readPreferences();
      const nextPreferences = { ...current, ...message.payload };
      await writePreferences(nextPreferences);
      const response = await apiFetch<UserProfile>('/api/v1/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(nextPreferences),
      });
      await writeStoredUser(response.data);
      sendResponse({ success: true, data: response.data });
    })();
    return true;
  }

  if (message.type === 'RESUME_SESSION') {
    void (async () => {
      const tab = await queryActiveTab();
      if (!tab?.id) {
        throw new Error('No active tab to inject into.');
      }

      const response = await apiFetch<{ prompt: string }>(`/api/v1/sessions/${message.payload.id}/resume`, {
        method: 'POST',
      });
      await sendMessageToTab(tab.id, {
        type: 'INJECT_PASSPORT',
        payload: { passport: response.data.prompt },
      });
      sendResponse({ success: true, data: response.data.prompt });
    })();
    return true;
  }

  if (message.type === 'GET_SESSION_DETAIL') {
    void apiFetch(`/api/v1/sessions/${message.payload.id}`)
      .then((response) => sendResponse({ success: true, data: response.data }))
      .catch((error: Error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  return false;
});
