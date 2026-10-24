/** The few bits of `document.documentElement` and i18next that matter here (easy to fake in tests). */
interface PageRoot {
  lang: string;
  setAttribute(name: string, value: string): void;
}

interface LanguageSource {
  /** Undefined until i18next has finished initialising (this runs before the app does). */
  language: string | undefined;
  on(event: 'languageChanged', listener: (language: string) => void): void;
}

/**
 * Keeps the page's declared language equal to the app's language and marks the page as
 * "do not translate". Browsers decide whether to offer (or silently apply) automatic
 * translation from <html lang>: a French app declared as English got translated "to French",
 * which rewrites the text nodes React is managing and crashes it.
 */
export function applyPageLanguage(root: PageRoot, source: LanguageSource): void {
  const sync = (language?: string) => {
    root.lang = (language ?? '').split('-')[0] || 'fr';
    root.setAttribute('translate', 'no');
  };
  sync(source.language);
  source.on('languageChanged', sync);
}
