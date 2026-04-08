import { BaseContentScript } from '../utils/content-script';

class ClaudeContentScript extends BaseContentScript {
  public constructor() {
    super({
      platform: 'claude',
      userMessages: ['[data-testid="user-message"]', '[data-role="user"]', '[data-is-streaming="false"] .font-user-message'],
      assistantMessages: ['[data-testid="assistant-message"]', '[data-role="assistant"]', '.prose'],
      input: ['div[contenteditable="true"]', 'textarea'],
      limitIndicators: ['usage limit', 'message limit', 'try again later'],
    });
  }
}

new ClaudeContentScript().register();

