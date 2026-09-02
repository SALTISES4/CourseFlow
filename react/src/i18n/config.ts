export const supportedLocales = ['en-CA', 'fr-CA'] as const

export type SupportedLocale = (typeof supportedLocales)[number]
export type ApiLanguagePreference = 'en' | 'fr'

export const fallbackLocale: SupportedLocale = 'en-CA'

const localeAliases: Readonly<Record<string, SupportedLocale>> = {
  en: 'en-CA',
  'en-ca': 'en-CA',
  fr: 'fr-CA',
  'fr-ca': 'fr-CA'
}

export function normalizeLocale(value: unknown): SupportedLocale {
  if (typeof value !== 'string') {
    return fallbackLocale
  }

  return localeAliases[value.trim().toLowerCase()] ?? fallbackLocale
}

export function toApiLanguagePreference(
  locale: SupportedLocale
): ApiLanguagePreference {
  return locale === 'fr-CA' ? 'fr' : 'en'
}
