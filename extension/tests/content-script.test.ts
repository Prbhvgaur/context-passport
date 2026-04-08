import { BaseContentScript } from '../src/utils/content-script';

class TestContentScript extends BaseContentScript {
  public constructor() {
    super({
      platform: 'chatgpt',
      userMessages: ['[data-user]'],
      assistantMessages: ['[data-assistant]'],
      input: ['textarea'],
      limitIndicators: ['limit reached'],
    });
  }
}

describe('BaseContentScript', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div data-user>Hello</div>
      <div data-assistant>World</div>
      <textarea></textarea>
    `;
    (chrome.runtime.sendMessage as unknown as jest.Mock).mockResolvedValue({ success: true });
  });

  it('extracts messages from the page', async () => {
    const script = new TestContentScript();
    const messages = await script.extractMessages();

    expect(messages).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'World' },
    ]);
  });

  it('injects a passport into the input', () => {
    const script = new TestContentScript();
    script.injectContext('CONTEXT PASSPORT');

    expect((document.querySelector('textarea') as HTMLTextAreaElement).value).toBe('CONTEXT PASSPORT');
  });

  it('detects platform, limits, and handles runtime messages', async () => {
    document.body.innerHTML += `<div>limit reached</div>`;
    const script = new TestContentScript();
    script.register();

    expect(script.detectPlatform()).toBe('chatgpt');
    expect(script.detectLimit()).toBe(true);

    const listener = (chrome.runtime.onMessage.addListener as unknown as jest.Mock).mock.calls[0]?.[0];
    const captureResponse = jest.fn();
    const injectResponse = jest.fn();

    const captureReturn = listener?.({ type: 'CAPTURE_SESSION' }, {}, captureResponse);
    await Promise.resolve();
    expect(captureReturn).toBe(true);
    expect(captureResponse).toHaveBeenCalled();

    listener?.({ type: 'INJECT_PASSPORT', payload: { passport: 'RESTORED' } }, {}, injectResponse);
    expect(injectResponse).toHaveBeenCalledWith({ success: true });
  });
});
