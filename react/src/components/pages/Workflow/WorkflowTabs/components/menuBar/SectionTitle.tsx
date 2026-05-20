import { TitleText } from '@cf/components/common/UIPrimitives/Titles'
import { selectSectionByUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

type PropsType = {
  objectId: string
}

const SectionTitle = ({ objectId }: PropsType) => {
  const sectionSelector = useMemo(
    () => selectSectionByUuid(objectId),
    [objectId]
  )
  const section = useSelector(sectionSelector)

  return (
    <TitleText
      text={section?.title ?? ''}
      defaultText={`Section ${objectId}`}
    />
  )
}

export default SectionTitle
