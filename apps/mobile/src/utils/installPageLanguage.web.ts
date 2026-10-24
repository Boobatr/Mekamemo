import i18n from '../i18n';
import { applyPageLanguage } from './applyPageLanguage';

// Web only (native builds resolve installPageLanguage.ts, a no-op).
applyPageLanguage(document.documentElement, i18n);
