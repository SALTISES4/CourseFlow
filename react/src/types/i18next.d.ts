import 'i18next'

import type { defaultNamespace, resources } from '@cf/i18n/resources'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNamespace
    resources: (typeof resources)['en-CA']
    returnNull: false
  }
}
