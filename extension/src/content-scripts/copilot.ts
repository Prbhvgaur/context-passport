import { BaseContentScript } from '../utils/content-script';

class CopilotContentScript extends BaseContentScript {
  public constructor() {
    super({
      platform: 'copilot',
      userMessages: ['[data-content="user"]', '[class*="userMessage"]'],
      assistantMessages: ['[data-content="assistant"]', '[class*="botMessage"]'],
      input: ['textarea', 'div[contenteditable="true"]'],
      limitIndicators: ['limit reached', 'try later', 'rate limit'],
    });
  }
}

new CopilotContentScript().register();

