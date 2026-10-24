import { applyPageLanguage } from './applyPageLanguage';

function fakePage(initialLanguage: string | undefined) {
  let listener: (language: string) => void = () => {};
  const root = { lang: 'en', setAttribute: jest.fn() };
  const source = {
    language: initialLanguage,
    on: (_event: 'languageChanged', fn: (language: string) => void) => {
      listener = fn;
    },
  };
  return { root, source, changeLanguageTo: (language: string) => listener(language) };
}

describe('applyPageLanguage', () => {
  it('declares the app language (not English) and forbids automatic translation', () => {
    const { root, source } = fakePage('fr');

    applyPageLanguage(root, source);

    expect(root.lang).toBe('fr');
    expect(root.setAttribute).toHaveBeenCalledWith('translate', 'no');
  });

  it('keeps the page language in step when the user switches language', () => {
    const { root, source, changeLanguageTo } = fakePage('fr');
    applyPageLanguage(root, source);

    changeLanguageTo('en');

    expect(root.lang).toBe('en');
  });

  it('copes with the language not being known yet when it runs (it loads before the app starts)', () => {
    const { root, source, changeLanguageTo } = fakePage(undefined);

    expect(() => applyPageLanguage(root, source)).not.toThrow();
    expect(root.lang).toBe('fr');

    changeLanguageTo('en'); // i18next announces the language once it is ready
    expect(root.lang).toBe('en');
  });

  it('reduces a regional code to the language ("fr-CA" → "fr") and never leaves it empty', () => {
    const { root, source, changeLanguageTo } = fakePage('fr-CA');
    applyPageLanguage(root, source);
    expect(root.lang).toBe('fr');

    changeLanguageTo('');
    expect(root.lang).toBe('fr');
  });
});
