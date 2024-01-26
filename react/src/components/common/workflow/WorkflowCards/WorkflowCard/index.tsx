import { Component, RefObject, createRef, MouseEvent } from 'react'
import * as Utility from '@cfUtility'
import * as Constants from '@cfConstants'
import { WorkflowTitle } from '@cfUIComponents/Titles'
import { WorkflowCardProps } from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard/type'
import { Workflow } from '@cfModule/types/common'
import { WorkflowType } from '@cfModule/types/enum'
import { toggleFavourite } from '@XMLHTTP/API/update'
import {
  CardWrap,
  CardHeader,
  CardContent,
  CardFooter,
  CardFooterTags,
  CardFooterActions,
  CardTitle,
  CardCaption,
  CardDescription
} from './styles'

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
export type WorkflowCardState = StateType

class WorkflowCard<
  P extends WorkflowCardProps,
  S extends StateType
> extends Component<P, S> {
  protected readonly mainDiv: RefObject<HTMLDivElement>
  private readonly workflow: Workflow

  constructor(props: P) {
    super(props)
    this.state = {
      favourite: props.workflowData.favourite
    } as S
    this.workflow = this.props.workflowData
    this.mainDiv = createRef()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  clickAction() {
    const { selectAction } = this.props

    if (selectAction) {
      selectAction(this.workflow.id)
    } else {
      window.location.href = COURSEFLOW_APP.config.update_path[
        this.workflow.type
      ].replace('0', String(this.workflow.id))
    }
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  TypeIndicator = () => {
    const { type, is_strategy } = this.workflow

    let typeText = window.gettext(type)
    if (type === WorkflowType.LIVE_PROJECT) {
      typeText = window.gettext('classroom')
    }
    if (is_strategy) {
      typeText += ` ${window.gettext('strategy')}`
    }
    return (
      <div className={'workflow-type-indicator ' + type}>
        {Utility.capWords(typeText)}
      </div>
    )
  }

  FavouriteButton = () => {
    const { favourite } = this.state
    const { workflow } = this

    if (workflow.type === WorkflowType.LIVE_PROJECT) {
      return null
    }

    const favClass = favourite ? ' filled' : ''
    const toggleFavouriteAction = (evt: MouseEvent<HTMLDivElement>) => {
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

  WorkflowCount = () => {
    const details = []
    const { workflow } = this

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

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const { selected, noHyperlink } = this.props

    return (
      <CardWrap
        ref={this.mainDiv}
        className={`${this.workflow.type} ${selected ? ' selected' : ''}`}
        onClick={this.clickAction.bind(this)}
        onMouseDown={(evt) => evt.preventDefault()}
      >
        <CardHeader>
          <CardTitle variant="h6">
            <WorkflowTitle
              no_hyperlink={noHyperlink}
              class_name="workflow-title"
              data={this.workflow}
            />
          </CardTitle>
          <CardCaption variant="caption">
            {window.gettext('Owned by')} {this.workflow.author}
          </CardCaption>
        </CardHeader>

        {this.workflow.description && (
          <CardContent>
            <CardDescription variant="body2">
              {this.workflow.description}
            </CardDescription>
          </CardContent>
        )}
        <CardFooter>
          <CardFooterTags>
            <this.TypeIndicator />
            <this.WorkflowCount />
          </CardFooterTags>
          <CardFooterActions>
            <this.FavouriteButton />
          </CardFooterActions>
        </CardFooter>
      </CardWrap>
    )
  }
}

export default WorkflowCard
