import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import EditableComponentWithSorting from '@cfEditableComponents/EditableComponentWithSorting'
import {
  EditableComponentWithSortingProps,
  EditableComponentWithSortingState
} from '@cfEditableComponents/EditableComponentWithSorting'
import { getSortedOutcomesFromOutcomeWorkflowSet } from '@cfFindState'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import { newOutcomeQuery } from '@XMLHTTP/API/create'
import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import * as React from 'react'
import { connect } from 'react-redux'
// @components

import Outcome from './Outcome'

// import $ from 'jquery'

type ConnectedProps = {
  data: any
  workflow: any
}
type StateType = EditableComponentWithSortingState
type OwnProps = EditableComponentWithSortingProps
type PropsType = ConnectedProps & OwnProps

export type OutcomeEditViewProps = OwnProps
export type OutcomeEditViewState = StateType
/**
 * The view of a workflow in which the outcomes can be added,
 * edited, removed
 */
export class OutcomeEditViewUnconnected<
  P extends PropsType,
  S extends StateType
> extends EditableComponentWithSorting<P, S> {
  static contextType = WorkFlowConfigContext
  declare context: React.ContextType<typeof WorkFlowConfigContext>

  constructor(props: P) {
    super(props)
    this.objectType = CfObjectType.WORKFLOW
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeDragAndDrop()
  }

  componentDidUpdate() {
    this.makeDragAndDrop()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  stopSortFunction() {}

  makeDragAndDrop() {
    this.makeSortableNode(
      $(this.mainDiv.current).find('.outcome-workflow').not('ui-draggable'),
      this.props.objectId,
      'outcomeworkflow',
      '.outcome-workflow'
    )
    if (this.props.data.depth === 0) {
      // @ts-ignore // @todo where does this come from
      this.makeDroppable()
    }
  }

  sortableMovedFunction(id, new_position, type, new_parent, child_id) {
    this.context.editableMethods.microUpdate(
      ActionCreator.moveOutcomeWorkflow(
        id,
        new_position,
        this.props.workflow.id,
        child_id
      )
    )
    insertedAt(
      // @ts-ignore
      this.context.selectionManager,
      child_id,
      'outcome',
      this.props.workflow.id,
      'workflow',
      new_position,
      'outcomeworkflow'
    )
  }

  addNewWrapper(objectset) {
    newOutcomeQuery(this.props.workflow.id, objectset.id)
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  AddNew = ({ objectset }: any) => {
    if (!this.context.permissions.workflowPermission.readOnly) {
      return (
        <div
          id="add-new-outcome"
          className="menu-create hover-shade"
          onClick={this.addNewWrapper.bind(this, objectset)}
        >
          <img
            className="create-button"
            src={
              COURSEFLOW_APP.globalContextData.path.static_assets.icon +
              'add_new_white.svg'
            }
          />
          <div>{_t('Add new')}</div>
        </div>
      )
    }
    return <></>
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const defaultMessage = (
      <>
        <div className="emptytext">
          {_t(
            'Here you can add and edit outcomes for the current workflow. They will then be available in the Workflow view to tag nodes in the Outcomes tab of the sidebar.'
          )}
        </div>
        <this.AddNew objectset={{}} />
      </>
    )

    const outcomes = this.props.data.length
      ? this.props.data.map((category, index) => (
          <div key={index} className="outcome-category">
            <h4>{category.objectset.title + ':'}</h4>
            <div className="outcome-category-block">
              {category.outcomes.map((outcome) => {
                let my_class = 'outcome-workflow'
                if (outcome.through_noDrag) my_class += ' no-drag'
                return (
                  <div
                    className={my_class}
                    data-child-id={outcome.id}
                    id={outcome.outcomeworkflow}
                    key={outcome.outcomeworkflow}
                  >
                    <Outcome
                      key={outcome.id}
                      objectId={outcome.id}
                      parentID={this.props.workflow.id}
                      //renderer={this.props.renderer}
                      show_horizontal={true}
                    />
                  </div>
                )
              })}

              <this.AddNew objectset={category.objectset} />
            </div>
          </div>
        ))
      : defaultMessage

    return (
      <div
        id={'#workflow-' + this.props.workflow.id}
        className="workflow-details"
      >
        <div className="outcome-edit" ref={this.mainDiv}>
          {outcomes}
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state: AppState): ConnectedProps => {
  return {
    data: getSortedOutcomesFromOutcomeWorkflowSet(
      state,
      state.workflow.outcomeworkflowSet
    ),
    workflow: state.workflow
  }
}

export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(OutcomeEditViewUnconnected)
