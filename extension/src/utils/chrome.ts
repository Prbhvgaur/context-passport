export const getFromStorage = async <T>(key: string): Promise<T | null> => {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T | undefined) ?? null;
};

export const setInStorage = async <T>(key: string, value: T) => {
  await chrome.storage.local.set({ [key]: value });
};

export const removeFromStorage = async (key: string) => {
  await chrome.storage.local.remove(key);
};

export const queryActiveTab = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
};

export const sendMessage = async <TResponse>(message: unknown): Promise<TResponse> => {
  const response: unknown = await chrome.runtime.sendMessage(message);
  return response as TResponse;
};

export const sendMessageToTab = async <TResponse>(tabId: number, message: unknown): Promise<TResponse> => {
  const response: unknown = await chrome.tabs.sendMessage(tabId, message);
  return response as TResponse;
};

export const getGoogleAccessToken = async (): Promise<string> => {
  const token: unknown = await chrome.identity.getAuthToken({ interactive: true });
  return typeof token === 'string' ? token : '';
};
