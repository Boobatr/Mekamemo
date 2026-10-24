export interface Sender {
  name: string;
  email: string;
}

const DEFAULT_SENDER: Sender = { name: 'MekaMemo', email: 'rendezvous@mekamemo.app' };

/** "MekaMemo <me@example.com>" or a bare "me@example.com" → { name, email }. */
export function parseSender(raw: string | undefined): Sender {
  const value = raw?.trim();
  if (!value) return DEFAULT_SENDER;

  const named = value.match(/^(.*?)\s*<([^<>\s]+@[^<>\s]+)>$/);
  if (named) return { name: named[1].replace(/^"|"$/g, '').trim() || DEFAULT_SENDER.name, email: named[2] };

  return /^[^<>\s]+@[^<>\s]+$/.test(value) ? { name: DEFAULT_SENDER.name, email: value } : DEFAULT_SENDER;
}

/** The form Resend expects in its `from` field. */
export function formatSender(sender: Sender): string {
  return `${sender.name} <${sender.email}>`;
}
