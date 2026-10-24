import { BrevoEmailProvider } from './brevo-email.provider';
import { formatSender, parseSender } from './sender';

describe('parseSender', () => {
  it('reads "Name <address>" and a bare address', () => {
    expect(parseSender('MekaMemo <me@example.com>')).toEqual({ name: 'MekaMemo', email: 'me@example.com' });
    expect(parseSender('"Équipe MekaMemo" <me@example.com>')).toEqual({ name: 'Équipe MekaMemo', email: 'me@example.com' });
    expect(parseSender('me@example.com')).toEqual({ name: 'MekaMemo', email: 'me@example.com' });
  });

  it('falls back to the default sender when nothing usable is configured', () => {
    for (const raw of [undefined, '', '   ', 'not an address', '<>']) {
      expect(parseSender(raw)).toEqual({ name: 'MekaMemo', email: 'rendezvous@mekamemo.app' });
    }
  });

  it('formats a sender the way Resend expects', () => {
    expect(formatSender({ name: 'MekaMemo', email: 'me@example.com' })).toBe('MekaMemo <me@example.com>');
  });
});

describe('BrevoEmailProvider', () => {
  const config = (values: Record<string, string>) => ({ get: (key: string) => values[key] }) as never;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
  });
  afterEach(() => fetchSpy.mockRestore());

  it('posts the message to Brevo with the API key and the configured sender', async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 201, text: async () => '' } as Response);
    const provider = new BrevoEmailProvider(config({ BREVO_API_KEY: 'xkeysib-123', MAIL_FROM: 'MekaMemo <me@example.com>' }));

    await provider.send({ to: 'marc@courriel.ca', subject: 'Sujet', body: 'Corps' });

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.headers['api-key']).toBe('xkeysib-123');
    expect(JSON.parse(init.body)).toEqual({
      sender: { name: 'MekaMemo', email: 'me@example.com' },
      to: [{ email: 'marc@courriel.ca' }],
      subject: 'Sujet',
      textContent: 'Corps',
    });
  });

  it('never throws, so a mail outage cannot break the request that triggered it', async () => {
    const provider = new BrevoEmailProvider(config({ BREVO_API_KEY: 'k' }));

    fetchSpy.mockResolvedValue({ ok: false, status: 401, text: async () => 'unauthorized' } as Response);
    await expect(provider.send({ to: 'a@b.ca', subject: 's', body: 'b' })).resolves.toBeUndefined();

    fetchSpy.mockRejectedValue(new Error('network down'));
    await expect(provider.send({ to: 'a@b.ca', subject: 's', body: 'b' })).resolves.toBeUndefined();
  });
});
