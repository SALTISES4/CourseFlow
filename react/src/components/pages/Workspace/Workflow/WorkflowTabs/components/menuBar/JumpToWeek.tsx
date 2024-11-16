import { apiPaths } from '@cf/router/apiRoutes'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import { selectWeekById } from '@cfRedux/selectors/week.selector'
import { AppState } from '@cfRedux/types/type'
import React, { useCallback } from 'react'
import { useSelector } from 'react-redux'

type PropsType = {
  objectId: number
}

const JumpToWeek = ({ objectId }: PropsType) => {
  const weekData = useSelector((state: AppState) =>
    selectWeekById(state, objectId)
  )
  const workflow = useSelector((state: AppState) => state.workflow)

  const test = () => {
    const element = document.querySelector(
      `[data-scroll-to-id='week-block-${objectId}']`
    )
    console.log('Attempting to scroll to element for object ID:', objectId)

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  const src =
    apiPaths.external.static_assets.icon +
    (weekData.week.isDropped ? 'minus.svg' : 'plus.svg')

  return (
    <div
      className="hover-shade"
      onClick={() => {
        console.log('clicked')
      }}
    >
      <TitleText text={weekData.week.title} defaultText="hello" />
    </div>
  )
}

export default JumpToWeek
