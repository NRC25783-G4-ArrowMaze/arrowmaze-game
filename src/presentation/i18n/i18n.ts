import { es } from './catalogs/es';
import { en } from './catalogs/en';

/** Idiomas soportados en v1 (D1). */
export type Lang = 'es' | 'en';

/** Diccionario anidado de claves → traducción (o sub-diccionario). */
export interface Catalog {
  [key: string]: string | Catalog;
}

/** Parámetros de interpolación para textos dinámicos (Rule de textos con parámetros). */
export type TranslateParams = Record<string, string | number>;

export const SUPPORTED_LANGUAGES: readonly Lang[] = ['es', 'en'];

/** Catálogos externalizados, uno por idioma (Background del spec). */
export const CATALOGS: Record<Lang, Catalog> = { es, en };

/** Idioma de respaldo cuando una clave falta en el idioma activo (D4). */
const FALLBACK_LANG: Lang = 'en';

/** Resuelve una clave jerárquica ("a.b.c") en un catálogo; undefined si no existe. */
function lookup(catalog: Catalog, key: string): string | undefined {
  let current: string | Catalog | undefined = catalog;
  for (const part of key.split('.')) {
    if (current === undefined || typeof current === 'string') return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

/** Interpola {param} en la plantilla; deja el marcador intacto si falta el valor. */
function interpolate(template: string, params?: TranslateParams): string {
  if (params === undefined) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/**
 * Traduce `key` al idioma `lang`. Si la clave no existe en ese idioma, cae al
 * catálogo en inglés (D4). Si tampoco existe allí, devuelve la clave literal
 * como último recurso (el test de paridad garantiza que esto no ocurra en la UI).
 */
export function translate(lang: Lang, key: string, params?: TranslateParams): string {
  const raw = lookup(CATALOGS[lang], key) ?? lookup(CATALOGS[FALLBACK_LANG], key);
  if (raw === undefined) return key;
  return interpolate(raw, params);
}

/**
 * Idioma inicial (D1, D2): la preferencia guardada prevalece; si no hay, se usa
 * el locale del dispositivo (es* → ES; cualquier otro → EN, fallback).
 */
export function resolveInitialLanguage(saved: string | null, deviceLocale: string): Lang {
  if (saved === 'es' || saved === 'en') return saved;
  return deviceLocale.toLowerCase().startsWith('es') ? 'es' : 'en';
}
