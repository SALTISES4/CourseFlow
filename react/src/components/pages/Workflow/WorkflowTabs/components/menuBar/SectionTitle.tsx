import { TitleText } from '@cf/components/common/UIPrimitives/Titles.ts.tsx'
import { selectSectionById } from '@cf/redux/selectors/section.selector'
import { RootState } from '@cf/redux/store'
import { useSelector } from 'react-redux'

type PropsType = {
  objectId: string
}

const SectionTitle = ({ objectId }: PropsType) => {
  const section = useSelector((state: RootState) =>
    selectSectionById(state, objectId)
  )

  return <TitleText text={section.title} defaultText={`Section ${objectId}`} />
}

export default SectionTitle
