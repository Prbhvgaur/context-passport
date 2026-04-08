import { BaseContentScript } from '../utils/content-script';

class GeminiContentScript extends BaseContentScript {
  public constructor() {
    super({
      platform: 'gemini',
      userMessages: ['user-query', '[data-test-id="user-query"]'],
      assistantMessages: ['model-response', '.markdown'],
      input: ['textarea', 'div[contenteditable="true"]'],
      limitIndicators: ['quota', 'limit reached', 'please try again later'],
    });
  }
}

new GeminiContentScript().register();

