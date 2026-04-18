import { sendPreviewMessage } from './preview-runtime';

const hasChromeApi = () =>
  typeof globalThis.chrome !== 'undefined' &&
  typeof globalThis.chrome.runtime?.sendMessage === 'function' &&
  typeof globalThis.chrome.storage?.local?.get === 'function';

export const isExtensionApiAvailable = () => hasChromeApi();

const readPreviewStorage = <T>(key: string): T | null => {
  try {
    const raw = globalThis.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writePreviewStorage = <T>(key: string, value: T) => {
  try {
    globalThis.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore preview persistence failures.
  }
};

export const getFromStorage = async <T>(key: string): Promise<T | null> => {
  if (!hasChromeApi()) {
    return readPreviewStorage<T>(key);
  }

  const result = await chrome.storage.local.get(key);
  return (result[key] as T | undefined) ?? null;
};

export const setInStorage = async <T>(key: string, value: T) => {
  if (!hasChromeApi()) {
    writePreviewStorage(key, value);
    return;
  }

  await chrome.storage.local.set({ [key]: value });
};

export const removeFromStorage = async (key: string) => {
  if (!hasChromeApi()) {
    globalThis.localStorage.removeItem(key);
    return;
  }

  await chrome.storage.local.remove(key);
};

export const queryActiveTab = async () => {
  if (!hasChromeApi()) {
    return null;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
};

export const sendMessage = async <TResponse>(message: unknown): Promise<TResponse> => {
  if (!hasChromeApi()) {
    return sendPreviewMessage<TResponse>(message);
  }

  const response: unknown = await chrome.runtime.sendMessage(message);
  return response as TResponse;
};

export const sendMessageToTab = async <TResponse>(tabId: number, message: unknown): Promise<TResponse> => {
  if (!hasChromeApi()) {
    throw new Error(`No active extension tab available for preview message to tab ${tabId}.`);
  }

  const response: unknown = await chrome.tabs.sendMessage(tabId, message);
  return response as TResponse;
};

export const getGoogleAccessToken = async (): Promise<string> => {
  if (!hasChromeApi()) {
    return 'preview-token';
  }

  const token: unknown = await chrome.identity.getAuthToken({ interactive: true });
  return typeof token === 'string' ? token : '';
};
