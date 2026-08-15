export const PUSH_PROVIDER = 'PUSH_PROVIDER';

export interface PushMessage {
  pushToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushProvider {
  send(message: PushMessage): Promise<void>;
}
