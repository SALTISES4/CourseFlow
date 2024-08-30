import { Component, RefObject, createRef, MouseEvent, ReactNode } from 'react'
import * as Utility from '@cfUtility'
import * as Constants from '@cfConstants'
import WorkflowCardDumb, {
  CHIP_TYPE,
  WorkflowCardChipType
} from '../WorkflowCardDumb'
import { WorkflowTitle } from '@cfCommonComponents/UIComponents/Titles'
import { WorkflowCardProps } from '@cfCommonComponents/cards/WorkflowCard/type'
import {LibraryObjectType, WorkflowType} from '@cfModule/types/enum'
import { toggleFavourite } from '@XMLHTTP/API/user'
import GroupIcon from '@mui/icons-material/Group'
import ErrorIcon from '@mui/icons-material/Error'
import { ELibraryObject } from '@XMLHTTP/types/entity'
import { _t } from '@cf/utility/utilityFunctions'

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
  private readonly workflow: ELibraryObject

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
      window.location.href =
        COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
          '0',
          String(this.workflow.id)
        )
    }
  }

  getTypeChip = (): WorkflowCardChipType => {
    const { type, is_strategy } = this.workflow
    let typeText = _t(type)

    if (type === LibraryObjectType.LIVE_PROJECT) {
      typeText = _t('classroom')
    }

    if (is_strategy) {
      typeText += ` ${_t('strategy')}`
    }

    const chipType =
      type === LibraryObjectType.LIVE_PROJECT ? CHIP_TYPE.DEFAULT : type

    return {
      type: chipType as CHIP_TYPE,
      label: Utility.capWords(typeText)
    }
  }

  getTemplateChip = (): WorkflowCardChipType => {
    // @ts-ignore @todo why isn't is_template defined
    const is_template = this.workflow.is_template
    if (is_template)
      return {
        type: CHIP_TYPE.TEMPLATE,
        label: _t('Template')
      }
  }

  getWorkflowCountChip = (): WorkflowCardChipType => {
    const { workflow } = this

    if (
      workflow.type === LibraryObjectType.PROJECT &&
      workflow.workflow_count !== null &&
      workflow.workflow_count > 0
    ) {
      return {
        type: CHIP_TYPE.DEFAULT,
        label: `${workflow.workflow_count} ${_t(
          `workflow` + (workflow.workflow_count > 1 ? 's' : '')
        )}`
      }
    }
  }

  getFavouriteOptions = () => {
    const { favourite } = this.state
    const { workflow } = this

    if (workflow.type === LibraryObjectType.LIVE_PROJECT) {
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
      workflow.type === LibraryObjectType.PROJECT &&
      workflow.has_liveproject &&
      workflow.object_permission.role_type !== Constants.role_keys['none']
    ) {
      details.push(
        <div
          key="workflow-created-group"
          className="workflow-created workflow-live-classroom"
          title={_t('Live Classroom')}
        >
          {/* small-inline */}
          <GroupIcon />
          {` ${_t('Live Classroom')}`}
        </div>
      )
    }

    // Linked workflow warning
    if (this.workflow.is_linked) {
      details.push(
        <div
          key="workflow-created-warning"
          className="workflow-created linked-workflow-warning"
          title={_t(
            'Warning: linking the same workflow to multiple nodes can result in loss of readability if you are associating parent workflow outcomes with child workflow outcomes.'
          )}
        >
          {/*red filled small-inline*/}
          <ErrorIcon />
          {` ${_t('Already in use')}`}
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
        id={this.workflow.id}
        title={
          <WorkflowTitle
            no_hyperlink={noHyperlink}
            class_name="workflow-title"
            data={this.workflow}
          />
        }
        description={
          this.workflow.author && `${_t('Owned by')} ${this.workflow.author}`
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
