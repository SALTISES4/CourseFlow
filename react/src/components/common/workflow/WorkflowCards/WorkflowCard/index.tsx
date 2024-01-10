import * as React from 'react'
import * as Utility from '@cfUtility'
import * as Constants from '@cfConstants'
import { WorkflowTitle } from '@cfUIComponents/Titles'
import {
  setWorkflowVisibilityQuery,
  toggleFavourite
} from '@XMLHTTP/PostFunctions'
import { WorkflowCardProps } from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard/type'
import { Workflow } from '@cfModule/types/common'
import { WorkflowType } from '@cfModule/types/enum'

/*******************************************************
 * A workflow card for a menu
 *
 * Props must include workflow_data (serialized model) and context.
 * // @todo this is wrong, context is not used, leave note during regression testing in case helpful
 * Context will determine which actions are added.
 *
 * Can also optionally receive a clickAction prop to override the behaviour
 * on c
 *******************************************************/

type StateType = {
  favourite: any
}

class WorkflowCard extends React.Component<WorkflowCardProps, StateType> {
  private readonly mainDiv: React.RefObject<HTMLDivElement>
  private readonly workflow: Workflow
  private readonly updateWorkflow: any
  private readonly selectAction: any
  private readonly userRole: any
  private readonly readOnly: any
  private projectData: any
  private selected: any
  private noHyperlink: any

  constructor(props: WorkflowCardProps) {
    super(props)
    this.state = {
      favourite: props.workflowData.favourite
    }
    this.selected = this.props.selected
    this.noHyperlink = this.props.noHyperlink
    this.userRole = this.props.userRole // from renderer
    this.readOnly = this.props.readOnly // from renderer
    this.projectData = this.props.projectData // from renderer
    this.updateWorkflow = this.props.updateWorkflow
    this.workflow = this.props.workflowData
    this.selectAction = this.props.selectAction
    this.mainDiv = React.createRef()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  clickAction() {
    if (this.selectAction) {
      this.selectAction(this.workflow.id)
    } else {
      window.location.href = COURSEFLOW_APP.config.update_path[
        this.workflow.type
      ].replace('0', String(this.workflow.id))
    }
  }

  visibilityFunction(id, is_visible) {
    const isVisibleBool = is_visible === 'true'
    this.updateWorkflow(id, {
      is_visible: isVisibleBool
    })
    // @todo not sure of use case for 'visibility toggle'
    // if we are passing mutation of the workflow
    // it doesn't make sense to then have this post query in the child also
    // these mutations should be combined
    setWorkflowVisibilityQuery(this.projectData.id, id, isVisibleBool)
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  TypeIndicator = () => {
    const { type, is_strategy } = this.workflow
    let type_text = window.gettext(type)
    if (type === WorkflowType.LIVE_PROJECT) {
      type_text = window.gettext('classroom')
    }
    if (is_strategy) {
      type_text += window.gettext(' strategy')
    }
    return (
      <div className={'workflow-type-indicator ' + type}>
        {Utility.capWords(type_text)}
      </div>
    )
  }

  FavouriteButton = () => {
    const favourite = this.state.favourite
    const workflow = this.workflow

    if (workflow.type === WorkflowType.LIVE_PROJECT) return null

    const favClass = favourite ? ' filled' : ''
    const toggleFavouriteAction = (evt) => {
      toggleFavourite(workflow.id, workflow.type, !favourite)
      this.setState({ favourite: !favourite })
      evt.stopPropagation()
    }

    return (
      <div
        key="btn-workflow-toggle-favourite"
        className="workflow-toggle-favourite hover-shade"
        onClick={toggleFavouriteAction}
      >
        <span
          className={`material-symbols-outlined${favClass}`}
          title={window.gettext('Favourite')}
        >
          star
        </span>
      </div>
    )
  }

  WorkflowDetails = () => {
    const details = []
    const workflow = this.workflow

    // Workflow count
    if (
      workflow.type === WorkflowType.PROJECT &&
      workflow.workflow_count != null
    ) {
      details.push(
        <div key="workflow-created-count" className="workflow-created">
          {`${workflow.workflow_count} ${window.gettext('workflows')}`}
        </div>
      )
    }

    // Live classroom indicator
    if (
      workflow.type === WorkflowType.PROJECT &&
      workflow.has_liveproject &&
      workflow.object_permission.role_type !== Constants.role_keys['none']
    ) {
      details.push(
        <div
          key="workflow-created-group"
          className="workflow-created workflow-live-classroom"
          title={window.gettext('Live Classroom')}
        >
          <span className="material-symbols-rounded small-inline">group</span>
          {` ${window.gettext('Live Classroom')}`}
        </div>
      )
    }

    // Linked workflow warning
    if (this.workflow.is_linked) {
      details.push(
        <div
          key="workflow-created-warning"
          className="workflow-created linked-workflow-warning"
          title={window.gettext(
            'Warning: linking the same workflow to multiple nodes can result in loss of readability if you are associating parent workflow outcomes with child workflow outcomes.'
          )}
        >
          <span className="material-symbols-rounded red filled small-inline">
            error
          </span>
          {` ${window.gettext('Already in use')}`}
        </div>
      )
    }

    return details
  }

  Buttons = () => {
    return (
      <div className="workflow-buttons-row">
        <div>
          <this.FavouriteButton />
        </div>
        <div>
          <this.WorkflowDetails />
        </div>
      </div>
    )
  }

  Visible = () => {
    const isTeacher = this.userRole === Constants.role_keys.teacher
    const isEligibleType =
      this.workflow.type !== WorkflowType.PROJECT &&
      this.workflow.type !== WorkflowType.LIVE_PROJECT

    if (!this.readOnly && isTeacher && isEligibleType) {
      return (
        <div
          className="permission-select"
          onClick={(evt) => evt.stopPropagation()}
          onMouseDown={(evt) => evt.stopPropagation()}
        >
          <select
            value={String(this.workflow.is_visible)}
            onChange={(evt) =>
              this.visibilityFunction(this.workflow.id, evt.target.value)
            }
          >
            <option value="false">{window.gettext('Not Visible')}</option>
            <option value="true">{window.gettext('Visible')}</option>
          </select>
        </div>
      )
    }

    return null
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  renderCreationText(data) {
    let creationText = window.gettext('Created')
    if (data.author && data.author !== 'None') {
      creationText += ` ${window.gettext('by')} ${data.author}`
    }
    creationText += `${window.gettext(' on ')}${data.created_on}`
    return creationText
  }

  renderDescription(description: string) {
    if (!description) {
      return <div className="workflow-description" />
    }
    return (
      <div
        className="workflow-description collapsible-text"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    )
  }

  render() {
    const { selected, noHyperlink } = this.props

    const cssClass = `workflow-for-menu hover-shade ${this.workflow.type} ${
      selected ? ' selected' : ''
    }`
    const creationText = this.renderCreationText(this.workflow)
    const description = this.renderDescription(this.workflow.description)

    return (
      <div
        ref={this.mainDiv}
        className={cssClass}
        onClick={this.clickAction.bind(this)}
        onMouseDown={(evt) => evt.preventDefault()}
      >
        <div className="workflow-top-row">
          <WorkflowTitle
            no_hyperlink={noHyperlink}
            class_name="workflow-title"
            data={this.workflow}
          />
          <this.Visible />
          {<this.TypeIndicator />}
        </div>
        <div className="workflow-created">{creationText}</div>
        {description}
        <this.Buttons />
      </div>
    )
  }
}

export default WorkflowCard
