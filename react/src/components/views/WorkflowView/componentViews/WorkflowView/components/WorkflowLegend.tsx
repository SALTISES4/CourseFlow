import * as Constants from '@cf/constants'
// import $ from 'jquery'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { apiPaths } from '@cf/router/apiRoutes'
import { _t } from '@cf/utility/utilityFunctions'
import LegendLine from '@cfComponents/UIPrimitives/LegendLine'
import Slider from '@cfComponents/UIPrimitives/Slider'
import { AppState } from '@cfRedux/types/type'
import * as React from 'react'
import * as reactDom from 'react-dom'
import { connect } from 'react-redux'

type StateType = {
  show_slider: boolean
  show_legend: boolean
}
type ConnectedProps = {
  contexts?: any
  tasks?: any
  strategies?: any
}

type PropsType = ConnectedProps

const choices = COURSEFLOW_APP.globalContextData.workflowChoices

export class WorkflowLegendUnconnected<
  P extends PropsType
> extends React.Component<P, StateType> {
  static contextType = WorkFlowConfigContext

  declare context: React.ContextType<typeof WorkFlowConfigContext>
  constructor(props: P) {
    super(props)
    this.state = {
      show_legend: !!JSON.parse(localStorage.getItem('show_legend')),
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
    this.setState({
      show_slider: true
    })
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  toggle() {
    localStorage.setItem('show_legend', String(!this.state.show_legend))
    this.setState({ show_legend: !this.state.show_legend })
  }

  getSlider() {
    if (this.state.show_slider) {
      // dynamic react/src/components/common/components/MenuBar.tsx
      return reactDom.createPortal(
        <>
          <div>{_t('Legend')}</div>,
          <Slider
            checked={this.state.show_legend}
            toggleAction={this.toggle.bind(this)}
          />
        </>,
        $('#viewbar')[0]
      )
    }
    return null
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    this.getSlider()

    if (!this.state.show_legend) {
      return <></>
    }

    const contexts = this.props.contexts.map((value, index) => (
      <LegendLine
        key={index}
        icon={Constants.contextKeys[value]}
        text={choices.contextChoices.find((obj) => obj.type == value).name}
      />
    ))

    const tasks = this.props.tasks.map((value, index) => (
      <LegendLine
        key={index}
        icon={Constants.taskKeys[value]}
        text={choices.taskChoices.find((obj) => obj.type == value).name}
      />
    ))

    const strategies = this.props.strategies.map((value, index) => (
      <LegendLine
        key={index}
        icon={Constants.strategyKeys[value]}
        text={
          choices.strategyClassification_choices.find(
            (obj) => obj.type == value
          ).name
        }
      />
    ))

    return (
      <div className="workflow-legend">
        <h4>Legend</h4>

        {!!contexts.length && (
          <div className="legend-section">
            <hr />
            <h5>Contexts:</h5>
            {contexts}
          </div>
        )}

        {!!tasks.length && (
          <div className="legend-section">
            <hr />
            <h5>Tasks:</h5>
            {tasks}
          </div>
        )}

        {!!strategies.length && (
          <div className="legend-section">
            <hr />
            <h5>Strategies:</h5>
            {strategies}
          </div>
        )}

        <div className="window-close-button" onClick={this.toggle.bind(this)}>
          <img src={apiPaths.external.static_assets.icon + 'close.svg'} />
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state: AppState): ConnectedProps => {
  let contexts = []
  let tasks = []
  let strategies = []
  const uniqueTest = function (value, index, self) {
    return self.indexOf(value) === index
  }
  contexts = state.node
    .map((node) => parseInt(node.contextClassification.toString(), 10))
    .filter(uniqueTest)
    .filter((value) => value > 0)

  tasks = state.node
    .map((node) => parseInt(node.taskClassification.toString(), 10))
    .filter(uniqueTest)
    .filter((value) => value > 0)

  strategies = state.week
    .map((week) => parseInt(week.strategyClassification.toString(), 10))
    .filter(uniqueTest)
    .filter((value) => value > 0)

  return {
    contexts: contexts,
    tasks: tasks,
    strategies: strategies
  }
}

const WorkflowLegend = connect<ConnectedProps, object, object, AppState>(
  mapStateToProps,
  null
)(WorkflowLegendUnconnected)

export default WorkflowLegend
