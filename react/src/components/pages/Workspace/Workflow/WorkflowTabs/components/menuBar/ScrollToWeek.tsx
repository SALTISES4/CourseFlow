import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import { selectWeekById } from '@cfRedux/selectors/week.selector'
import { RootState } from '@cfRedux/store'
import React, { useCallback } from 'react'
import { useSelector } from 'react-redux'

type PropsType = {
  objectId: number
}

const ScrollToWeek = ({ objectId }: PropsType) => {
  const week = useSelector((state: RootState) =>
    selectWeekById(state, objectId)
  )
  // call in the workflow here because we use it for the
  // 'week' label which changes based on workflow type
  // we don't have a good solution for this yet
  const workflow = useSelector((state: RootState) => state.workspace.workflow)

  const scrollToHandler = useCallback(() => {
    const element = document.querySelector(
      `[data-scroll-to-id='week-block-${objectId}']`
    )

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }, [objectId])

  return (
    <div
      className="hover-shade"
      onClick={() => {
        scrollToHandler()
      }}
    >
      <TitleText text={week.title} defaultText={`Week ${objectId}`} />
    </div>
  )
}

export default ScrollToWeek
