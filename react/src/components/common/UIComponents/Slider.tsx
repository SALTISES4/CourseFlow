import * as React from 'react'

type PropsType = {
  checked: boolean
  toggleAction: () => void
}

class Slider extends React.Component<PropsType> {
  render() {
    return (
      <label className="switch">
        <input
          type="checkbox"
          checked={this.props.checked}
          onChange={this.props.toggleAction.bind(this)}
        />
        <span className="slider round" />
      </label>
    )
  }
}

export default Slider
