import { _t } from '@cf/utility/Utility.class'

export const outcomeTitleFallback = (): string => _t('Untitled outcome')

export const displayOutcomeTitle = (title: string): string =>
  title || outcomeTitleFallback()
