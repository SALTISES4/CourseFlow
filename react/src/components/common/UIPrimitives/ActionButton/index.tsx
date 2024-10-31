import { apiPaths } from '@cf/router/apiRoutes'
import React, { ReactElement } from 'react'

interface ActionButtonProps {
  buttonIcon: ReactElement
  buttonClass: string
  titleText: string
  handleClick: (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
}

const ActionButton = ({
  buttonClass,
  titleText,
  buttonIcon,
  handleClick
}: ActionButtonProps) => {
  const onClickHandler = (
    evt: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    handleClick(evt)
    evt.stopPropagation()
  }

  return (
    <div
      className={`${buttonClass} action-button`}
      title={titleText}
      onClick={onClickHandler}
    >
      {buttonIcon}
    </div>
  )
}

export default ActionButton
