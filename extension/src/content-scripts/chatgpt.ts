import { BaseContentScript } from '../utils/content-script';

class ChatGPTContentScript extends BaseContentScript {
  public constructor() {
    super({
      platform: 'chatgpt',
      userMessages: ['[data-message-author-role="user"]', '[data-testid="user-message"]'],
      assistantMessages: ['[data-message-author-role="assistant"]', '.markdown'],
      input: ['#prompt-textarea', 'textarea', 'div[contenteditable="true"]'],
      limitIndicators: ['usage cap', 'limit reached', 'try again later'],
    });
  }
}

new ChatGPTContentScript().register();

