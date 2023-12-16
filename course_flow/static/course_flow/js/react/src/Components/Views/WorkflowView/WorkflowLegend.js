import * as React from 'react'
import * as reactDom from 'react-dom'
import * as Constants from '@cfConstants'
import { connect } from 'react-redux'
import { Slider, LegendLine } from '@cfUIComponents'

class WorkflowLegendUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      show_legend: JSON.parse(localStorage.getItem('show_legend')),
      show_slider: false
    }
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidUpdate() {
    $('.workflow-legend').draggable()
  }

  componentDidMount() {
    $('.workflow-legend').draggable()
    this.setState({ show_slider: true })
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  toggle() {
    localStorage.setItem('show_legend', !this.state.show_legend)
    this.setState({ show_legend: !this.state.show_legend })
  }

  getSlider() {
    if (this.state.show_slider) {
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
    return null
  }

  /*******************************************************
   * RENDER
   *******************************************************/
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
          <img src={window.config.icon_path + 'close.svg'} />
        </div>
      </div>
    )
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
const WorkflowLegend = connect(mapStateToProps, null)(WorkflowLegendUnconnected)

export default WorkflowLegend
export { WorkflowLegendUnconnected }
