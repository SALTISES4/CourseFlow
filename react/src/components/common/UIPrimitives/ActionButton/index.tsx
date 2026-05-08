import React, { ReactElement } from 'react'

interface ActionButtonProps {
  buttonIcon: ReactElement
  buttonClass: string
  titleText: string
  onClickHandler: (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
}

const ActionButton = ({
  buttonClass,
  titleText,
  buttonIcon,
  onClickHandler
}: ActionButtonProps) => {
  const clickHandler = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    onClickHandler(evt)
    evt.stopPropagation()
  }

  return (
    <div
      className={`${buttonClass} action-button`}
      title={titleText}
      onClick={clickHandler}
    >
      {buttonIcon}
    </div>
  )
}

export default ActionButton
