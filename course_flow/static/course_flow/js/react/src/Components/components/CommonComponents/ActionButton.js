//A button which causes an item to delete itself or insert a new item below itself.
import * as React from 'react'

class ActionButton extends React.Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  render() {
    return (
      <div
        className={this.props.button_class + ' action-button'}
        title={this.props.titletext}
        onClick={this.handleClick}
      >
        <img src={config.icon_path + this.props.button_icon} />
      </div>
    )
  }

  handleClick(evt) {
    this.props.handleClick(evt)
    evt.stopPropagation()
  }
}

export default ActionButton
