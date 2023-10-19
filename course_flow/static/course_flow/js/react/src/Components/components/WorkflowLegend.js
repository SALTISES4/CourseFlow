import * as Redux from 'redux'
import * as React from 'react'
import * as reactDom from 'react-dom'
import * as Constants from '../../Constants.js'
import { Provider, connect } from 'react-redux'
import { Slider } from './CommonComponents.js'

class LegendLine extends React.Component {
  render() {
    let icon
    if (this.props.icon)
      icon = <img src={config.icon_path + this.props.icon + '.svg'} />
    else icon = <div className={this.props.divclass}>{this.props.div}</div>
    return (
      <div className="legend-line">
        {icon}
        <div>{this.props.text}</div>
      </div>
    )
  }
}

class WorkflowLegend extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      show_legend: JSON.parse(localStorage.getItem('show_legend'))
    }
  }

  render() {
    if (!this.state.show_legend) return this.getSlider()

    let contexts = this.props.contexts.map((value) => (
      <LegendLine
        icon={Constants.context_keys[value]}
        text={
          this.props.renderer.context_choices.find((obj) => obj.type == value)
            .name
        }
      />
    ))
    let tasks = this.props.tasks.map((value) => (
      <LegendLine
        icon={Constants.task_keys[value]}
        text={
          this.props.renderer.task_choices.find((obj) => obj.type == value).name
        }
      />
    ))
    let strategies = this.props.strategies.map((value) => (
      <LegendLine
        icon={Constants.strategy_keys[value]}
        text={
          this.props.renderer.strategy_classification_choices.find(
            (obj) => obj.type == value
          ).name
        }
      />
    ))

    return (
      <div className="workflow-legend">
        {this.getSlider()}
        <h4>Legend</h4>
        {contexts.length > 0 && (
          <div className="legend-section">
            <hr />
            <h5>Contexts:</h5>
            {contexts}
          </div>
        )}
        {contexts.length > 0 && (
          <div className="legend-section">
            <hr />
            <h5>Tasks:</h5>
            {tasks}
          </div>
        )}
        {contexts.length > 0 && (
          <div className="legend-section">
            <hr />
            <h5>Strategies:</h5>
            {strategies}
          </div>
        )}
        <div className="window-close-button" onClick={this.toggle.bind(this)}>
          <img src={config.icon_path + 'close.svg'} />
        </div>
      </div>
    )
  }

  toggle() {
    localStorage.setItem('show_legend', !this.state.show_legend)
    this.setState({ show_legend: !this.state.show_legend })
  }

  getSlider() {
    return reactDom.createPortal(
      [
        <div>{gettext('Legend')}</div>,
        <Slider
          checked={this.state.show_legend}
          toggleAction={this.toggle.bind(this)}
        />
      ],
      $('#viewbar')[0]
    )
  }

  componentDidMount() {
    $('.workflow-legend').draggable()
  }
}
const mapStateToProps = (state) => {
  let contexts = []
  let tasks = []
  let strategies = []
  let uniqueTest = function (value, index, self) {
    return self.indexOf(value) === index
  }
  contexts = state.node
    .map((node) => parseInt(node.context_classification))
    .filter(uniqueTest)
    .filter((value) => value > 0)
  tasks = state.node
    .map((node) => parseInt(node.task_classification))
    .filter(uniqueTest)
    .filter((value) => value > 0)
  strategies = state.week
    .map((week) => parseInt(week.strategy_classification))
    .filter(uniqueTest)
    .filter((value) => value > 0)
  return { contexts: contexts, tasks: tasks, strategies: strategies }
}
export default connect(mapStateToProps, null)(WorkflowLegend)

class WorkflowOutcomeLegendUnconnected extends WorkflowLegend {
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
          <img src={config.icon_path + 'close.svg'} />
        </div>
      </div>
    )
  }
}
const mapWorkflowOutcomeLegendStateToProps = (state) => {
  return { outcomes_type: state.workflow.outcomes_type }
}
export const WorkflowOutcomeLegend = connect(
  mapWorkflowOutcomeLegendStateToProps,
  null
)(WorkflowOutcomeLegendUnconnected)
