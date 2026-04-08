import '@testing-library/jest-dom';

const chromeMock = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
  identity: {
    getAuthToken: jest.fn(),
  },
} as unknown as typeof chrome;

Object.assign(globalThis, { chrome: chromeMock });

beforeEach(() => {
  (chrome.storage.local.get as unknown as jest.Mock).mockReset();
  (chrome.storage.local.set as unknown as jest.Mock).mockReset();
  (chrome.storage.local.remove as unknown as jest.Mock).mockReset();
  (chrome.tabs.query as unknown as jest.Mock).mockReset();
  (chrome.tabs.sendMessage as unknown as jest.Mock).mockReset();
  (chrome.runtime.sendMessage as unknown as jest.Mock).mockReset();
  (chrome.runtime.onMessage.addListener as unknown as jest.Mock).mockReset();
  (chrome.identity.getAuthToken as unknown as jest.Mock).mockReset();
});
