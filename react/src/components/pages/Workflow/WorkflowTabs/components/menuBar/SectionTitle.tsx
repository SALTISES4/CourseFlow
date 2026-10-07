import { selectSectionByUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import { TitleText } from '@cfComponents/UIPrimitives/Titles'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

type PropsType = {
  objectId: string
  sectionIndex: number
}

const SectionTitle = ({ objectId, sectionIndex }: PropsType) => {
  const { t } = useTranslation('workflow')
  const sectionSelector = useMemo(
    () => selectSectionByUuid(objectId),
    [objectId]
  )
  const section = useSelector(sectionSelector)
  const persistedTitle = section?.title ?? ''
  const title =
    persistedTitle.length > 0 ? persistedTitle : t('menu.untitledSection')
  const label = `${sectionIndex} - ${title}`

  return <TitleText text={label} defaultText={label} />
}

export default SectionTitle
