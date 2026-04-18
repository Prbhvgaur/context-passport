import {
  getFromStorage,
  getGoogleAccessToken,
  isExtensionApiAvailable,
  queryActiveTab,
  removeFromStorage,
  sendMessage,
  sendMessageToTab,
  setInStorage,
} from '../src/utils/chrome';
import {
  STORAGE_KEYS,
  clearStoredToken,
  readPreferences,
  readStoredSessions,
  writePreferences,
  writeStoredSessions,
} from '../src/utils/storage';

const chrome = globalThis.chrome;

describe('chrome utils and storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    (chrome.storage.local.get as unknown as jest.Mock).mockImplementation(
      async (key?: string | string[]) => {
      if (key === STORAGE_KEYS.preferences) {
        return {
          [STORAGE_KEYS.preferences]: {
            autoCapture: false,
            autoInject: true,
            compressionLevel: 'balanced',
            autoCaptureTrigger: 'limit-detected',
            autoInjectBehavior: 'ask-first',
            sessionExpiryDays: 30,
            theme: 'dark',
          },
        };
      }

      if (key === STORAGE_KEYS.sessions) {
        return { [STORAGE_KEYS.sessions]: [{ id: '1', title: 'session' }] };
      }

      return {};
      },
    );
    (chrome.tabs.query as unknown as jest.Mock).mockResolvedValue([{ id: 7 }] as chrome.tabs.Tab[]);
    (chrome.runtime.sendMessage as unknown as jest.Mock).mockResolvedValue({ success: true });
    (chrome.tabs.sendMessage as unknown as jest.Mock).mockResolvedValue({ success: true });
  });

  it('reads and writes local storage', async () => {
    await setInStorage('sample', { ok: true });
    await removeFromStorage('sample');

    expect(chrome.storage.local.set).toHaveBeenCalledWith({ sample: { ok: true } });
    expect(chrome.storage.local.remove).toHaveBeenCalledWith('sample');
    expect(await getFromStorage('missing')).toBeNull();
  });

  it('wraps message and tab helpers', async () => {
    await sendMessage({ type: 'PING' });
    await sendMessageToTab(7, { type: 'PING_TAB' });
    const tab = await queryActiveTab();

    expect(chrome.runtime.sendMessage).toHaveBeenCalled();
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(7, { type: 'PING_TAB' });
    expect(tab?.id).toBe(7);
  });

  it('reads convenience storage helpers', async () => {
    expect(await readPreferences()).toMatchObject({ autoCapture: false });
    expect(await readStoredSessions()).toEqual([{ id: '1', title: 'session' }]);

    await writePreferences({
      autoCapture: true,
      autoInject: true,
      compressionLevel: 'balanced',
      autoCaptureTrigger: 'limit-detected',
      autoInjectBehavior: 'ask-first',
      sessionExpiryDays: 30,
      theme: 'dark',
    });
    await writeStoredSessions([]);
    await clearStoredToken();

    expect(chrome.storage.local.set).toHaveBeenCalled();
    expect(chrome.storage.local.remove).toHaveBeenCalledWith(STORAGE_KEYS.authToken);
  });

  it('falls back to preview runtime when extension APIs are unavailable', async () => {
    const originalChrome = globalThis.chrome;

    Object.defineProperty(globalThis, 'chrome', {
      configurable: true,
      value: undefined,
      writable: true,
    });

    window.localStorage.setItem('broken-json', '{');

    expect(isExtensionApiAvailable()).toBe(false);
    expect(await getFromStorage('broken-json')).toBeNull();

    await setInStorage('preview-key', { preview: true });
    expect(window.localStorage.getItem('preview-key')).toBe(JSON.stringify({ preview: true }));
    expect(await getFromStorage('preview-key')).toEqual({ preview: true });

    await removeFromStorage('preview-key');
    expect(window.localStorage.getItem('preview-key')).toBeNull();

    const appState = await sendMessage<{ success: boolean; data: { sessions: unknown[] } }>({ type: 'GET_APP_STATE' });
    expect(appState.success).toBe(true);
    expect(appState.data.sessions.length).toBeGreaterThan(0);

    expect(await queryActiveTab()).toBeNull();
    expect(await getGoogleAccessToken()).toBe('preview-token');
    await expect(sendMessageToTab(99, { type: 'PING_TAB' })).rejects.toThrow(
      'No active extension tab available for preview message to tab 99.',
    );

    Object.defineProperty(globalThis, 'chrome', {
      configurable: true,
      value: originalChrome,
      writable: true,
    });
  });

  it('handles empty chrome results and auth token edge cases', async () => {
    (chrome.tabs.query as unknown as jest.Mock).mockResolvedValue([]);
    (chrome.identity.getAuthToken as unknown as jest.Mock).mockResolvedValueOnce('token-123');

    expect(await queryActiveTab()).toBeNull();
    expect(await getGoogleAccessToken()).toBe('token-123');

    (chrome.identity.getAuthToken as unknown as jest.Mock).mockResolvedValueOnce({ token: 'invalid-shape' });
    expect(await getGoogleAccessToken()).toBe('');
  });
});
