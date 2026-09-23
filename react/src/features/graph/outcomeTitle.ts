import type { TFunction } from 'i18next'

import type { OutcomeEntity } from './state/model/types'
import {
  displayEditableSystemTitle,
  displaySystemTitle
} from '../../i18n/systemTitles'

export const displayOutcomeTitle = (
  outcome: Pick<OutcomeEntity, 'title' | 'titleCopyCount'>,
  t: TFunction<'workflow'>,
  fallback: string
): string => displaySystemTitle(t, outcome, fallback)

export const displayEditableOutcomeTitle = (
  outcome: Pick<OutcomeEntity, 'title' | 'titleCopyCount'>,
  t: TFunction<'workflow'>,
  fallback: string
): string => displayEditableSystemTitle(t, outcome, fallback)
