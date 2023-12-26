// @ts-nocheck
// Creates a slider input

import * as React from 'react'

class Slider extends React.Component {
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
