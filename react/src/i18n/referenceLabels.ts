import { normalizeLocale } from '@cf/i18n/config'
import type { TFunction } from 'i18next'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import referenceEn from './locales/en-CA/reference'

type ReferenceGroup = 'discipline' | 'context' | 'taskClassification' | 'timeUnit'
type ReferenceCode<Group extends ReferenceGroup> = keyof (typeof referenceEn)[Group]
type ReferenceTranslationKey = {
  [Group in ReferenceGroup]: `${Group}.${Extract<ReferenceCode<Group>, string>}`
}[ReferenceGroup]

function isKnownCode<Group extends ReferenceGroup>(
  group: Group,
  code: string
): code is Extract<ReferenceCode<Group>, string> {
  return Object.prototype.hasOwnProperty.call(referenceEn[group], code)
}

function translateCode<Group extends ReferenceGroup>(
  t: TFunction<'reference'>,
  group: Group,
  code: string
): string {
  if (isKnownCode(group, code)) {
    return t(`${group}.${code}` as ReferenceTranslationKey)
  }

  if (import.meta.env.DEV) {
    console.error(`Missing ${group} translation for code: ${code}`)
  }
  return t('unknown', { code })
}

export function useReferenceLabels() {
  const { t, i18n } = useTranslation('reference')
  const locale = normalizeLocale(i18n.resolvedLanguage)
  const collator = useMemo(
    () => new Intl.Collator(locale, { sensitivity: 'base' }),
    [locale]
  )

  const disciplineLabel = useCallback(
    (code: string) => translateCode(t, 'discipline', code),
    [t]
  )
  const contextLabel = useCallback(
    (code: string) => translateCode(t, 'context', code),
    [t]
  )
  const taskClassificationLabel = useCallback(
    (code: string) => translateCode(t, 'taskClassification', code),
    [t]
  )
  const timeUnitLabel = useCallback(
    (code: string) => translateCode(t, 'timeUnit', code),
    [t]
  )

  return {
    locale,
    collator,
    disciplineLabel,
    contextLabel,
    taskClassificationLabel,
    timeUnitLabel
  }
}
