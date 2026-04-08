import { BaseContentScript } from '../utils/content-script';

class PerplexityContentScript extends BaseContentScript {
  public constructor() {
    super({
      platform: 'perplexity',
      userMessages: ['[data-testid="user-message"]', '[class*="messageUser"]'],
      assistantMessages: ['[data-testid="assistant-message"]', '[class*="messageAnswer"]'],
      input: ['textarea', 'div[contenteditable="true"]'],
      limitIndicators: ['message limit', 'quota', 'please wait before sending'],
    });
  }
}

new PerplexityContentScript().register();

