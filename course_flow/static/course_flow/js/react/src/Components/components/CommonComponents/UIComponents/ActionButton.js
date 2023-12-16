//A button which causes an item to delete itself or insert a new item below itself.
import * as React from 'react'

class ActionButton extends React.Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(evt) {
    this.props.handleClick(evt)
    evt.stopPropagation()
  }

  render() {
    return (
      <div
        className={this.props.button_class + ' action-button'}
        title={this.props.titletext}
        onClick={this.handleClick}
      >
        <img src={window.config.icon_path + this.props.button_icon} />
      </div>
    )
  }
}

export default ActionButton
