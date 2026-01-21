import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import { selectWeekById } from '@cfRedux/selectors/week.selector'
import { RootState } from '@cfRedux/store'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'

type PropsType = {
  objectId: number
}

const ScrollToWeek = ({ objectId }: PropsType) => {
  const week = useSelector((state: RootState) =>
    selectWeekById(state, objectId)
  )

  const scrollToHandler = useCallback(() => {
    const weekEl = document.querySelector(`[data-week-id='${objectId}']`)
    weekEl?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }, [objectId])

  return (
    <div onClick={scrollToHandler}>
      <TitleText text={week.title} defaultText={`Week ${objectId}`} />
    </div>
  )
}

export default ScrollToWeek
