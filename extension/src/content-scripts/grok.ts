import { BaseContentScript } from '../utils/content-script';

class GrokContentScript extends BaseContentScript {
  public constructor() {
    super({
      platform: 'grok',
      userMessages: ['[data-testid="conversation-turn-user"]', '[class*="userMessage"]'],
      assistantMessages: ['[data-testid="conversation-turn-assistant"]', '[class*="assistantMessage"]'],
      input: ['textarea', 'div[contenteditable="true"]'],
      limitIndicators: ['usage limit', 'rate limit', 'please come back later'],
    });
  }
}

new GrokContentScript().register();

