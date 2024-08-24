import * as React from 'react'

// Define the props type
interface LegendLineProps {
  icon?: string
  divclass?: string
  div?: string | JSX.Element
  text: string | JSX.Element
}

class LegendLine extends React.Component<LegendLineProps> {
  Icon = () => {
    if (this.props.icon) {
      return (
        <img
          src={`${COURSEFLOW_APP.path.static_assets.icon}${this.props.icon}.svg`}
          alt="icon"
        />
      )
    }
    return <div className={this.props.divclass}>{this.props.div}</div>
  }

  render() {
    return (
      <div className="legend-line">
        <this.Icon />
        <div>{this.props.text}</div>
      </div>
    )
  }
}

export default LegendLine
