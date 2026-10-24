import { formatResetCode } from './password-reset-code';
import type { EmailMessage } from '../quotes/email-provider.interface';

export const RESET_CODE_TTL_MINUTES = 30;

export function buildPasswordResetEmail(
  user: { email: string; fullName: string; language: 'fr' | 'en' },
  code: string,
): EmailMessage {
  const shown = formatResetCode(code);

  if (user.language === 'en') {
    return {
      to: user.email,
      subject: 'Your MekaMemo password reset code',
      body: [
        `Hello ${user.fullName},`,
        '',
        'Your MekaMemo password reset code is:',
        '',
        `    ${shown}`,
        '',
        `It is valid for ${RESET_CODE_TTL_MINUTES} minutes. Enter it in the app, with your email address, to choose a new password.`,
        '',
        "If you didn't ask for this, ignore this message: your password has not changed.",
        '',
        'The MekaMemo team',
      ].join('\n'),
    };
  }

  return {
    to: user.email,
    subject: 'Votre code de réinitialisation MekaMemo',
    body: [
      `Bonjour ${user.fullName},`,
      '',
      'Votre code de réinitialisation de mot de passe MekaMemo est :',
      '',
      `    ${shown}`,
      '',
      `Il est valide ${RESET_CODE_TTL_MINUTES} minutes. Entrez-le dans l'application, avec votre adresse courriel, pour choisir un nouveau mot de passe.`,
      '',
      "Si vous n'avez pas fait cette demande, ignorez ce message : votre mot de passe n'a pas changé.",
      '',
      "L'équipe MekaMemo",
    ].join('\n'),
  };
}
