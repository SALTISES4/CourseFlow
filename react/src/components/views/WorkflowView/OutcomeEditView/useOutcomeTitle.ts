import { displayOutcomeTitle } from '@cf/features/graph/outcomeTitle'
import { useTranslation } from 'react-i18next'

export const useOutcomeTitle = ({
  title,
  titleCopyCount
}: {
  title: string
  titleCopyCount: number
}): string => {
  const { t } = useTranslation('workflow')

  const outcomeTitle = displayOutcomeTitle(
    { title, titleCopyCount },
    t,
    t('outcomes.untitled')
  )

  return outcomeTitle
}

export default useOutcomeTitle
