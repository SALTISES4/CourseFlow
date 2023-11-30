import * as React from 'react'
import { AssignmentView } from '../LiveAssignmentView/index.js'
import {
  ActionButton,
  NodeTitle,
  TitleText,
  WorkflowTitle
} from '../../components/CommonComponents'
import { getWorkflowNodes } from '../../../PostFunctions.js'
import * as Constants from '../../../Constants.js'
import {LiveProjectSection} from "./LiveProjectSection.js";

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
    if (prevProps.objectID != this.props.objectID) {
      this.setState({ data: null }, this.getData.bind(this))
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  getData() {
    let component = this
    getWorkflowNodes(this.props.objectID, (data) => {
      component.setState({ data: data.data_package })
    })
  }

  defaultRender() {
    // @todo undefined scope error
    return <renderers.WorkflowLoader />
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    if (!this.state.data) return this.defaultRender()
    let weeks = this.state.data.weeks.map((week, i) => {
      let nodes = week.nodes.map((node) => (
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
    let data = this.props.data
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
            config.icon_path +
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
            config.icon_path +
            Constants.task_keys[data.task_classification] +
            '.svg'
          }
        />
      )
    let style = { backgroundColor: Constants.getColumnColour(this.props.data) }
    let mouseover_actions = [this.addCreateAssignment(data)]

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
        button_icon="assignment.svg"
        button_class="duplicate-self-button"
        titletext={gettext('Create Assignment')}
        handleClick={this.createAssignment.bind(this, data)}
      />
    )
  }

  createAssignment(data) {
    let props = this.props
    props.renderer.tiny_loader.startLoad()
    createAssignment(
      data.id,
      props.renderer.project_data.id,
      (response_data) => {
        props.renderer.tiny_loader.endLoad()
        window.location = config.update_path.liveassignment.replace(
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
    let assignments = this.state.data.assignments.map((assignment) => (
      <AssignmentView renderer={this.props.renderer} data={assignment} />
    ))
    let workflow_options = this.state.data.workflows.map((workflow) => {
      let view_class = 'hover-shade'
      if (workflow.id == this.state.selected_id) view_class += ' active'
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
        <h3>{gettext('Assigned Tasks')}</h3>
        <div>{assignments}</div>
        <h3>{gettext('All Tasks')}</h3>
        <div id="select-workflow" className="workflow-view-select">
          {workflow_options}
        </div>
        {workflow_nodes}
      </div>
    )
  }
}

export default LiveProjectAssignments
