import * as React from 'react'
import { connect } from 'react-redux'
import LegendLine from '@cfCommonComponents/UIComponents/LegendLine'
import { AppState } from '@cfRedux/types/type.js'
import { WorkflowLegendUnconnected } from '@cfViews/WorkflowView/componentViews/WorkflowView/components/WorkflowLegend'

type ConnectedProps = {
  outcomes_type: any
}
type OwnProps = any
type PropsType = OwnProps & ConnectedProps
class OutcomeLegendUnconnected extends WorkflowLegendUnconnected<PropsType> {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    this.getSlider()
    if (!this.state.show_legend) {
      return <></>
    }
    return (
      <div className="workflow-legend">
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
          <img
            src={
              COURSEFLOW_APP.globalContextData.path.static_assets.icon +
              'close.svg'
            }
          />
        </div>
      </div>
    )
  }
}
const mapStateToProps = (state: AppState): ConnectedProps => {
  return {
    outcomes_type: state.workflow.outcomes_type
  }
}

const OutcomeLegend = connect<ConnectedProps, object, object, AppState>(
  mapStateToProps,
  null
)(OutcomeLegendUnconnected)

export default OutcomeLegend
