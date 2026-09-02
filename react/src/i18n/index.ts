import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import { fallbackLocale, normalizeLocale } from './config'
import { defaultNamespace, resources } from './resources'

const i18n = i18next.createInstance()

void i18n.use(initReactI18next).init({
  resources,
  lng: fallbackLocale,
  fallbackLng: fallbackLocale,
  supportedLngs: Object.keys(resources),
  nonExplicitSupportedLngs: false,
  defaultNS: defaultNamespace,
  ns: Object.keys(resources[fallbackLocale]),
  interpolation: {
    escapeValue: false
  },
  saveMissing: import.meta.env.DEV,
  missingKeyHandler: (_languages, namespace, key) => {
    console.error(`Missing translation key: ${namespace}:${key}`)
  },
  parseMissingKeyHandler: (key) =>
    import.meta.env.DEV ? `⟦missing:${key}⟧` : key,
  initAsync: false,
  returnNull: false
})

export async function setAppLocale(value: unknown): Promise<void> {
  const locale = normalizeLocale(value)
  if (i18n.resolvedLanguage !== locale) {
    await i18n.changeLanguage(locale)
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = fallbackLocale
}

export default i18n
export * from './config'
