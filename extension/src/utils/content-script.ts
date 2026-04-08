import type { SessionMessage, SupportedPlatform } from '@context-passport/shared';

export interface PlatformSelectors {
  platform: SupportedPlatform;
  userMessages: string[];
  assistantMessages: string[];
  input: string[];
  limitIndicators: string[];
}

export interface CapturedSession {
  platform: SupportedPlatform;
  title: string;
  messages: SessionMessage[];
  limitDetected: boolean;
}

interface CaptureSessionMessage {
  type: 'CAPTURE_SESSION';
}

interface InjectPassportMessage {
  type: 'INJECT_PASSPORT';
  payload: {
    passport: string;
  };
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isCaptureSessionMessage = (value: unknown): value is CaptureSessionMessage =>
  isObjectRecord(value) && value['type'] === 'CAPTURE_SESSION';

const isInjectPassportMessage = (value: unknown): value is InjectPassportMessage =>
  isObjectRecord(value) &&
  value['type'] === 'INJECT_PASSPORT' &&
  isObjectRecord(value['payload']) &&
  typeof value['payload']['passport'] === 'string';

export abstract class BaseContentScript {
  protected readonly selectors: PlatformSelectors;

  protected constructor(selectors: PlatformSelectors) {
    this.selectors = selectors;
  }

  public detectPlatform(): string {
    return this.selectors.platform;
  }

  public extractMessages(): Promise<SessionMessage[]> {
    const userMessages = this.selectors.userMessages.flatMap((selector) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)).map((element) => ({
        role: 'user' as const,
        content: (element.innerText ?? element.textContent ?? '').trim(),
      })),
    );
    const assistantMessages = this.selectors.assistantMessages.flatMap((selector) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)).map((element) => ({
        role: 'assistant' as const,
        content: (element.innerText ?? element.textContent ?? '').trim(),
      })),
    );

    const merged = [...userMessages, ...assistantMessages]
      .filter((message) => message.content.length > 0)
      .slice(-200);

    return Promise.resolve(merged);
  }

  public detectLimit(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    const bodyText = (document.body?.innerText ?? document.body?.textContent ?? '').toLowerCase();
    return this.selectors.limitIndicators.some((indicator) => bodyText.includes(indicator.toLowerCase()));
  }

  public injectContext(passport: string): void {
    const input = this.findInput();
    if (!input) {
      return;
    }

    if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
      input.focus();
      input.value = passport;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    input.focus();
    input.textContent = passport;
    input.dispatchEvent(new InputEvent('input', { bubbles: true, data: passport, inputType: 'insertText' }));
  }

  public observeNewMessages(): void {
    const observer = new MutationObserver(async () => {
      if (!this.detectLimit()) {
        return;
      }

      const messages = await this.extractMessages();
      await chrome.runtime.sendMessage({
        type: 'CONTENT_LIMIT_DETECTED',
        payload: {
          platform: this.selectors.platform,
          title: document.title,
          messages,
          limitDetected: true,
        } satisfies CapturedSession,
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  public register(): void {
    this.observeNewMessages();

    chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
      if (isCaptureSessionMessage(message)) {
        void this.extractMessages().then((messages) => {
          sendResponse({
            platform: this.selectors.platform,
            title: document.title,
            messages,
            limitDetected: this.detectLimit(),
          } satisfies CapturedSession);
        });
        return true;
      }

      if (isInjectPassportMessage(message)) {
        this.injectContext(message.payload.passport);
        sendResponse({ success: true });
      }

      return false;
    });
  }

  private findInput() {
    for (const selector of this.selectors.input) {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) {
        return element;
      }
    }

    return null;
  }
}
