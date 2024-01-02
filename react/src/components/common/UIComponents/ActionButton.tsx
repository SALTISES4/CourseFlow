import * as React from 'react'

// Define the props type
interface ActionButtonProps {
  handleClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  buttonClass: string
  titleText: string
  buttonIcon: string
}

class ActionButton extends React.Component<ActionButtonProps> {
  constructor(props: ActionButtonProps) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(evt: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    this.props.handleClick(evt)
    evt.stopPropagation()
  }

  render() {
    const { buttonClass, titleText, buttonIcon } = this.props
    const iconPath = COURSEFLOW_APP.config.icon_path + buttonIcon

    return (
      <div
        className={`${buttonClass} action-button`}
        title={titleText}
        onClick={this.handleClick}
      >
        <img src={iconPath} alt={titleText} />
      </div>
    )
  }
}

export default ActionButton
