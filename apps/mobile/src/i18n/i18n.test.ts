import fr from './fr.json';
import en from './en.json';

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

describe('i18n FR/EN parity', () => {
  it('has the exact same key set in both languages', () => {
    const frKeys = flattenKeys(fr).sort();
    const enKeys = flattenKeys(en).sort();

    const missingInEn = frKeys.filter((k) => !enKeys.includes(k));
    const missingInFr = enKeys.filter((k) => !frKeys.includes(k));

    expect(missingInEn).toEqual([]);
    expect(missingInFr).toEqual([]);
  });

  it('has no empty translation strings', () => {
    const emptyKeys: string[] = [];
    for (const [lang, dict] of [
      ['fr', fr],
      ['en', en],
    ] as const) {
      for (const key of flattenKeys(dict)) {
        const value = key.split('.').reduce<any>((acc, part) => acc?.[part], dict);
        if (typeof value !== 'string' || value.trim().length === 0) {
          emptyKeys.push(`${lang}.${key}`);
        }
      }
    }
    expect(emptyKeys).toEqual([]);
  });
});
