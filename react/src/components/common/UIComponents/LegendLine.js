import * as React from 'react'

class LegendLine extends React.Component {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let icon
    if (this.props.icon)
      icon = (
        <img src={COURSEFLOW_APP.config.icon_path + this.props.icon + '.svg'} />
      )
    else icon = <div className={this.props.divclass}>{this.props.div}</div>
    return (
      <div className="legend-line">
        {icon}
        <div>{this.props.text}</div>
      </div>
    )
  }
}

export default LegendLine
