import { CATALOGS, type Catalog } from '../../src/presentation/i18n/i18n';

/** Aplana un catálogo anidado a un set ordenado de claves jerárquicas ("a.b.c"). */
function collectKeys(catalog: Catalog, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(catalog)) {
    const full = prefix === '' ? key : `${prefix}.${key}`;
    if (typeof value === 'string') {
      keys.push(full);
    } else {
      keys.push(...collectKeys(value, full));
    }
  }
  return keys.sort();
}

describe('i18n — paridad de claves ES/EN (Background del spec)', () => {
  const esKeys = collectKeys(CATALOGS.es);
  const enKeys = collectKeys(CATALOGS.en);

  it('ES y EN exponen exactamente el mismo conjunto de claves', () => {
    const faltanEnEn = esKeys.filter((k) => !enKeys.includes(k));
    const faltanEnEs = enKeys.filter((k) => !esKeys.includes(k));
    expect({ faltanEnEn, faltanEnEs }).toEqual({ faltanEnEn: [], faltanEnEs: [] });
  });

  it('ningún valor de traducción queda vacío', () => {
    for (const lang of ['es', 'en'] as const) {
      for (const key of collectKeys(CATALOGS[lang])) {
        const value = key
          .split('.')
          .reduce<string | Catalog>((acc, part) => (acc as Catalog)[part], CATALOGS[lang]);
        expect(typeof value === 'string' && value.length > 0).toBe(true);
      }
    }
  });
});
