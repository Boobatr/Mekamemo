export const EMAIL_PROVIDER = 'EMAIL_PROVIDER';

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}
