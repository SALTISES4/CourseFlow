import * as React from 'react'
import { createAssignmentQuery, getWorkflowNodes } from '@XMLHTTP/PostFunctions'
import * as Constants from '../../../constants'
// @components
import { AssignmentView } from '../LiveAssignmentView'
import {
  NodeTitle,
  TitleText,
  WorkflowTitle
} from '@cfCommonComponents/UIComponents'
import ActionButton from '@cfUIComponents/ActionButton'
import LiveProjectSection from './LiveProjectSection'

class AssignmentWorkflowNodesDisplay extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.getData()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.objectID !== this.props.objectID) {
      this.setState({ data: null }, this.getData.bind(this))
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  getData() {
    getWorkflowNodes(this.props.objectID, (data) => {
      this.setState({ data: data.data_package })
    })
  }

  defaultRender() {
    return <WorkflowLoader />
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    if (!this.state.data) return this.defaultRender()
    const weeks = this.state.data.weeks.map((week, i) => {
      const nodes = week.nodes.map((node) => (
        <AssignmentNode renderer={this.props.renderer} data={node} />
      ))
      let default_text
      default_text = week.week_type_display + ' ' + (i + 1)
      return (
        <div className="week">
          <TitleText text={week.title} defaultText={default_text} />
          <div className="node-block-grid">{nodes}</div>
        </div>
      )
    })
    return <div>{weeks}</div>
  }
}

class AssignmentNode extends React.Component {
  render() {
    const data = this.props.data
    let lefticon
    let righticon
    if (data.context_classification > 0)
      lefticon = (
        <img
          title={
            renderer.context_choices.find(
              (obj) => obj.type == data.context_classification
            ).name
          }
          src={
            COURSEFLOW_APP.config.icon_path +
            Constants.context_keys[data.context_classification] +
            '.svg'
          }
        />
      )
    if (data.task_classification > 0)
      righticon = (
        <img
          title={
            renderer.task_choices.find(
              (obj) => obj.type == data.task_classification
            ).name
          }
          src={
            COURSEFLOW_APP.config.icon_path +
            Constants.task_keys[data.task_classification] +
            '.svg'
          }
        />
      )
    const style = {
      backgroundColor: Constants.getColumnColour(this.props.data)
    }
    const mouseover_actions = [this.addCreateAssignment(data)]

    return (
      <div style={style} className="node">
        <div className="mouseover-actions">{mouseover_actions}</div>
        <div className="node-top-row">
          <div className="node-icon">{lefticon}</div>
          <NodeTitle data={this.props.data} />
          <div className="node-icon">{righticon}</div>
        </div>
        <div className="node-drop-row"></div>
      </div>
    )
  }

  addCreateAssignment(data) {
    return (
      <ActionButton
        buttonIcon="assignment.svg"
        buttonClass="duplicate-self-button"
        titleText={window.gettext('Create Assignment')}
        handleClick={this.createAssignment.bind(this, data)}
      />
    )
  }

  createAssignment(data) {
    const props = this.props
    props.renderer.tiny_loader.startLoad()
    createAssignmentQuery(
      data.id,
      props.renderer.project_data.id,
      (response_data) => {
        props.renderer.tiny_loader.endLoad()
        window.location =
          COURSEFLOW_APP.config.update_path.liveassignment.replace(
            '0',
            response_data.assignmentPk
          )
      }
    )
  }
}

class LiveProjectAssignments extends LiveProjectSection {
  changeView(workflow_id) {
    this.setState({ selected_id: workflow_id })
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    if (!this.state.data) return this.defaultRender()

    const assignments = this.state.data.assignments.map((assignment) => (
      <AssignmentView renderer={this.props.renderer} data={assignment} />
    ))

    const workflow_options = this.state.data.workflows.map((workflow) => {
      let view_class = 'hover-shade'
      if (workflow.id === this.state.selected_id) view_class += ' active'
      return (
        <div
          id={'button_' + workflow.id}
          className={view_class}
          onClick={this.changeView.bind(this, workflow.id)}
        >
          <WorkflowTitle no_hyperlink={true} data={workflow} />
        </div>
      )
    })

    let workflow_nodes
    if (this.state.selected_id) {
      workflow_nodes = (
        <AssignmentWorkflowNodesDisplay
          renderer={this.props.renderer}
          objectID={this.state.selected_id}
        />
      )
    }

    return (
      <div className="workflow-details">
        <h3>{window.gettext('Assigned Tasks')}</h3>
        <div>{assignments}</div>
        <h3>{window.gettext('All Tasks')}</h3>
        <div id="select-workflow" className="workflow-view-select">
          {workflow_options}
        </div>
        {workflow_nodes}
      </div>
    )
  }
}

export default LiveProjectAssignments
