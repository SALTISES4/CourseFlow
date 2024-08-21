import { Component, RefObject, createRef, MouseEvent, ReactNode } from 'react'
import * as Utility from '@cfUtility'
import * as Constants from '@cfConstants'
import WorkflowCardDumb, {
  CHIP_TYPE,
  WorklowCardChipType
} from '../WorkflowCardDumb'
import { WorkflowTitle } from '@cfCommonComponents/UIComponents/Titles'
import { WorkflowCardProps } from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard/type'
import { Workflow } from '@cfModule/types/common'
import { WorkflowType } from '@cfModule/types/enum'
import { toggleFavourite } from '@XMLHTTP/API/user'

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
      window.location.href = COURSEFLOW_APP.path.html.update_path_temp.replace(
        '0',
        String(this.workflow.id)
      )
    }
  }

  getTypeChip = (): WorklowCardChipType => {
    const { type, is_strategy } = this.workflow
    let typeText = window.gettext(type)

    if (type === WorkflowType.LIVE_PROJECT) {
      typeText = window.gettext('classroom')
    }

    if (is_strategy) {
      typeText += ` ${window.gettext('strategy')}`
    }

    const chipType =
      type === WorkflowType.LIVE_PROJECT ? CHIP_TYPE.DEFAULT : type

    return {
      type: chipType as CHIP_TYPE,
      label: Utility.capWords(typeText)
    }
  }

  getTemplateChip = (): WorklowCardChipType => {
    const is_template = this.workflow.is_template
    if (is_template)
      return {
        type: CHIP_TYPE.TEMPLATE,
        label: window.gettext('Template')
      }
  }

  getWorkflowCountChip = (): WorklowCardChipType => {
    const { workflow } = this

    if (
      workflow.type === WorkflowType.PROJECT &&
      workflow.workflow_count !== null &&
      workflow.workflow_count > 0
    ) {
      return {
        type: CHIP_TYPE.DEFAULT,
        label: `${workflow.workflow_count} ${window.gettext(
          `workflow` + (workflow.workflow_count > 1 ? 's' : '')
        )}`
      }
    }
  }

  getFavouriteOptions = () => {
    const { favourite } = this.state
    const { workflow } = this

    if (workflow.type === WorkflowType.LIVE_PROJECT) {
      return null
    }

    const toggleFavouriteAction = (evt: MouseEvent<HTMLButtonElement>) => {
      evt.stopPropagation()
      toggleFavourite(workflow.id, workflow.type, !favourite)
      this.setState({ favourite: !favourite })
    }

    return {
      isFavourite: favourite,
      onFavourite: toggleFavouriteAction
    }
  }

  // TODO: Determine where this is used and how to refactor it
  getWorkflowInfo = (): ReactNode[] => {
    const details: ReactNode[] = []
    const { workflow } = this

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
    const favouriteOptions = this.getFavouriteOptions()

    return (
      <WorkflowCardDumb
        title={
          <WorkflowTitle
            no_hyperlink={noHyperlink}
            class_name="workflow-title"
            data={this.workflow}
          />
        }
        caption={
          this.workflow.author &&
          `${window.gettext('Owned by')} ${this.workflow.author}`
        }
        isSelected={selected}
        isFavourite={favouriteOptions.isFavourite}
        onFavourite={favouriteOptions.onFavourite}
        onClick={this.clickAction.bind(this)}
        onMouseDown={(evt) => evt.preventDefault()}
        chips={[
          this.getTemplateChip(),
          this.getTypeChip(),
          this.getWorkflowInfo(),
          this.getWorkflowCountChip()
        ]}
      />
    )
  }
}

export default WorkflowCard
