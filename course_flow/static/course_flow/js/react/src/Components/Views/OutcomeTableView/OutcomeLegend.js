import * as React from 'react'
import { connect } from 'react-redux'
import { LegendLine } from '@cfUIComponents'
import { WorkflowLegendUnconnected } from '@cfViews/WorkflowView'

class OutcomeLegendUnconnected extends WorkflowLegendUnconnected {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    if (!this.state.show_legend) return this.getSlider()
    return (
      <div className="workflow-legend">
        {this.getSlider()}
        <h4>Legend</h4>
        <div className="legend-section">
          <hr />
          <h5>Outcomes:</h5>
          <LegendLine icon="solid_check" text="Complete" />
          <LegendLine icon="check" text="Completed (Auto-Calculated)" />
          <LegendLine icon="nocheck" text="Partially Complete" />
        </div>
        {this.props.outcomes_type == 1 && (
          <div className="legend-section">
            <hr />
            <h5>Advanced Outcomes:</h5>
            <LegendLine
              div="I"
              divclass="outcome-introduced self-completed"
              text="Introduced"
            />
            <LegendLine
              div="D"
              divclass="outcome-developed self-completed"
              text="Developed"
            />
            <LegendLine
              div="A"
              divclass="outcome-advanced self-completed"
              text="Advanced"
            />
            <LegendLine
              div="I"
              divclass="outcome-introduced"
              text="Introduced (Auto-Calculated)"
            />
            <LegendLine
              div="D"
              divclass="outcome-developed"
              text="Developed (Auto-Calculated)"
            />
            <LegendLine
              div="A"
              divclass="outcome-advanced"
              text="Advanced (Auto-Calculated)"
            />
          </div>
        )}
        <div className="window-close-button" onClick={this.toggle.bind(this)}>
          <img src={COURSEFLOW_APP.config.icon_path + 'close.svg'} />
        </div>
      </div>
    )
  }
}
const mapWorkflowOutcomeLegendStateToProps = (state) => {
  return { outcomes_type: state.workflow.outcomes_type }
}
const OutcomeLegend = connect(
  mapWorkflowOutcomeLegendStateToProps,
  null
)(OutcomeLegendUnconnected)

export default OutcomeLegend
