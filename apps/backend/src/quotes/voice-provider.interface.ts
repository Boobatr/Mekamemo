export const VOICE_PROVIDER = 'VOICE_PROVIDER';

export interface VoiceCallRequest {
  toPhoneNumber: string;
  message: string;
}

export interface VoiceProvider {
  call(request: VoiceCallRequest): Promise<void>;
}
