import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import { selectWeekById } from '@cfRedux/selectors/week.selector'
import { RootState } from '@cfRedux/store'
import { useSelector } from 'react-redux'

type PropsType = {
  objectid: string
}

const WeekTitle = ({ objectId }: PropsType) => {
  const week = useSelector((state: RootState) =>
    selectWeekById(state, objectId)
  )

  return <TitleText text={week.title} defaultText={`Week ${objectId}`} />
}

export default WeekTitle
