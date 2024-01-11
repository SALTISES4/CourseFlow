import * as React from 'react'
import * as reactDom from 'react-dom'
import {
  createAssignmentQuery,
  getAssignmentsForNode,
  setAssignmentCompletionQuery
} from '@XMLHTTP/PostFunctions'
import * as Constants from '@cfConstants'
import * as Utility from '@cfUtility'

import { AssignmentTitle, DatePicker } from '@cfUIComponents'
import ActionCreator from '@cfRedux/ActionCreator.ts'
import $ from 'jquery'

/**
 *
 */
class AssignmentForNode extends React.Component {
  constructor(props) {
    super(props)
    this.state = { is_dropped: false }
    this.user_id = COURSEFLOW_APP.contextData.user_id

    if (props.data.user_assignment)
      this.state.completed = props.data.user_assignment.completed
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  toggleDrop() {
    this.setState((state) => {
      return { is_dropped: !state.is_dropped }
    })
  }

  changeCompletion(evt) {
    const checked = evt.target.checked
    this.setState({ completed: checked })
    setAssignmentCompletionQuery(this.props.data.user_assignment.id, checked)
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const node_data = data.task
    let data_override
    if (node_data.represents_workflow)
      data_override = {
        ...node_data,
        ...node_data.linked_workflow_data,
        id: data.id
      }
    else data_override = { ...node_data }
    const css_class = 'assignment-in-node'
    let completion_data
    if (data.user_assignment) {
      let disabled = true
      if (
        this.props.renderer.user_role == Constants.role_keys.teacher ||
        (data.self_reporting &&
          //check AssignmentView for user defined in global scope
          data.user_assignment.liveprojectuser.user.id === user_id)
      )
        disabled = false
      let extra_data
      if (data.single_completion && data.user_assignment.completed) {
        extra_data = [
          <div>
            {window.gettext('Completed by ') +
              Utility.getUserDisplay(
                data.user_assignment.liveprojectuser.user
              ) +
              window.gettext(' on ')}
            <DatePicker
              default_value={data.user_assignment.completed_on}
              disabled={true}
            />
          </div>
        ]
      }
      completion_data = (
        <div>
          <label>{window.gettext('Completion')}: </label>
          <input
            type="checkbox"
            disabled={disabled}
            checked={this.state.completed}
            onChange={this.changeCompletion.bind(this)}
          />
          {extra_data}
        </div>
      )
    } else if (data.completion_info) {
      completion_data = (
        <div>{window.gettext('Completion') + ': ' + data.completion_info}</div>
      )
    }

    return (
      <div className={css_class}>
        <div className="node-top-row">
          <AssignmentTitle
            user_role={this.props.renderer.user_role}
            data={data}
          />
        </div>
        <div className="assignment-timing">
          <div>
            <div>
              <label>{window.gettext('End Date')}: </label>
              <DatePicker
                id="end_date"
                default_value={data.end_date}
                disabled={true}
              />
            </div>
            <div>
              <label>{window.gettext('Start Date')}: </label>
              <DatePicker
                id="start_date"
                default_value={data.start_date}
                disabled={true}
              />
            </div>
          </div>
          <div>{completion_data}</div>
        </div>
      </div>
    )
  }
}

/**
 *
 */
class AssignmentBox extends React.Component {
  constructor(props) {
    super(props)
    this.input = React.createRef()
    this.state = { my_assignments: [], all_assignments: [] }
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.setState({ has_rendered: true })
  }

  componentDidUpdate(prevProps) {
    if (this.props.show && !prevProps.show) this.reloadAssignments()
    if (!this.props.show && prevProps.show)
      this.setState({ my_assignments: [], all_assignments: [] })
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  reloadAssignments() {
    const node_id = this.props.node_id
    const props = this.props
    COURSEFLOW_APP.tinyLoader.startLoad()
    getAssignmentsForNode(node_id, (response_data) => {
      COURSEFLOW_APP.tinyLoader.endLoad()
      this.setState(response_data.data_package)
      if (
        !this.props.has_assignment &&
        (response_data.data_package.my_assignments.length > 0 ||
          response_data.data_package.all_assignments.length > 0)
      ) {
        props.dispatch(
          ActionCreator.reloadAssignmentsAction(props.node_id, true)
        )
      } else if (
        this.props.has_assignment &&
        response_data.data_package.my_assignments.length == 0 &&
        response_data.data_package.all_assignments.length == 0
      ) {
        props.dispatch(
          ActionCreator.reloadAssignmentsAction(props.node_id, false)
        )
      }
    })
  }

  createAssignment() {
    const props = this.props
    COURSEFLOW_APP.tinyLoader.startLoad()
    createAssignmentQuery(
      props.node_id,
      props.renderer.project.id,
      (response_data) => {
        COURSEFLOW_APP.tinyLoader.endLoad()
        this.reloadAssignments()
      }
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    if (!this.state.has_rendered) return null
    let assignment_indicator = null
    if (this.props.has_assignment)
      assignment_indicator = reactDom.createPortal(
        <div
          className="comment-indicator hover-shade"
          onClick={this.props.parent.showAssignment.bind(this.props.parent)}
        >
          <img src={COURSEFLOW_APP.config.icon_path + 'assignment.svg'} />
        </div>,
        $(this.props.parent.mainDiv.current)
          .children('.side-actions')
          .children('.assignment-indicator-container')[0]
      )

    if (!this.props.show) {
      return assignment_indicator
    }

    const top_contents = []
    top_contents.push(
      <div
        className="close-button hover-shade"
        title={window.gettext('Close')}
        onClick={this.props.parent.showAssignment.bind(this.props.parent)}
      >
        <img src={COURSEFLOW_APP.config.icon_path + 'close.svg'} />
      </div>
    )
    if (this.props.renderer.is_teacher) {
      top_contents.push(
        <div
          className="create-assignment hover-shade"
          title={window.gettext('Create New')}
          onClick={this.createAssignment.bind(this)}
        >
          <img src={COURSEFLOW_APP.config.icon_path + 'add_new.svg'} />
        </div>
      )
    }
    if (!this.props.has_assignment) {
      top_contents.push(<div>{window.gettext('Not yet assigned')}</div>)
    }

    const my_assignments = this.state.my_assignments.map((assignment) => (
      <AssignmentForNode data={assignment} renderer={this.props.renderer} />
    ))
    if (my_assignments.length > 0)
      my_assignments.unshift(<h4>{window.gettext('My Assignments')}</h4>)
    let all_assignments
    if (this.props.renderer.is_teacher) {
      all_assignments = this.state.all_assignments.map((assignment) => (
        <AssignmentForNode data={assignment} renderer={this.props.renderer} />
      ))
      if (all_assignments.length > 0)
        all_assignments.unshift(<h4>{window.gettext('All Assignments')}</h4>)
      if (my_assignments.length > 0 && all_assignments.length > 0)
        all_assignments.unshift(<hr />)
    }

    return reactDom.createPortal(
      [
        <div className="comment-box" onClick={(evt) => evt.stopPropagation()}>
          <div className="comment-top-row">{top_contents}</div>
          {my_assignments}
          {all_assignments}
        </div>,
        assignment_indicator
      ],
      $(this.props.parent.mainDiv.current)
        .children('.side-actions')
        .children('.assignment-indicator-container')[0]
    )
  }
}

export default AssignmentBox
