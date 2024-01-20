import * as React from 'react'
import { connect } from 'react-redux'
// @components
import { EditableComponentWithSorting } from '@cfParentComponents'
import { getSortedOutcomesFromOutcomeWorkflowSet } from '@cfFindState'
import Outcome from './Outcome'
import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import ActionCreator from '@cfRedux/ActionCreator'
import { newOutcomeQuery } from '@XMLHTTP/API/outcome'
import { CfObjectType } from '@cfModule/types/enum'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
import { AppState } from '@cfRedux/types/type'
import {
  EditableComponentWithSortingProps,
  EditableComponentWithSortingState
} from '@cfParentComponents/EditableComponentWithSorting'
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
   * COMPONENTS
   *******************************************************/
  AddNew = ({ objectset }: any) => {
    if (!this.context.read_only) {
      return (
        <div
          id="add-new-outcome"
          className="menu-create hover-shade"
          onClick={this.addNewWrapper.bind(this, objectset)}
        >
          <img
            className="create-button"
            src={COURSEFLOW_APP.config.icon_path + 'add_new_white.svg'}
          />
          <div>{window.gettext('Add new')}</div>
        </div>
      )
    }
    return <></>
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  stopSortFunction() {}

  makeDragAndDrop() {
    this.makeSortableNode(
      $(this.mainDiv.current).find('.outcome-workflow').not('ui-draggable'),
      this.props.objectID,
      'outcomeworkflow',
      '.outcome-workflow'
    )
    if (this.props.data.depth === 0) {
      // @ts-ignore // @todo where does this come from
      this.makeDroppable()
    }
  }

  sortableMovedFunction(id, new_position, type, new_parent, child_id) {
    this.context.micro_update(
      ActionCreator.moveOutcomeWorkflow(
        id,
        new_position,
        this.props.workflow.id,
        child_id
      )
    )
    insertedAt(
      // @ts-ignore
      this.props.renderer, // to remove
      child_id,
      'outcome',
      this.props.workflow.id,
      'workflow',
      new_position,
      'outcomeworkflow'
    )
  }

  addNewWrapper(objectset?) {
    newOutcomeQuery(this.props.workflow.id, objectset.id)
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const defaultMessage = (
      <>
        <div className="emptytext">
          {window.gettext(
            'Here you can add and edit outcomes for the current workflow. They will then be available in the Workflow view to tag nodes in the Outcomes tab of the sidebar.'
          )}
        </div>
        <this.AddNew />
      </>
    )

    const outcomes = this.props.data.length
      ? this.props.data.map((category, index) => (
          <div key={index} className="outcome-category">
            <h4>{category.objectset.title + ':'}</h4>
            <div className="outcome-category-block">
              {category.outcomes.map((outcome) => {
                let my_class = 'outcome-workflow'
                if (outcome.through_no_drag) my_class += ' no-drag'
                return (
                  <div
                    className={my_class}
                    data-child-id={outcome.id}
                    id={outcome.outcomeworkflow}
                    key={outcome.outcomeworkflow}
                  >
                    <Outcome
                      key={outcome.id}
                      objectID={outcome.id}
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

const mapEditViewStateToProps = (state: AppState): ConnectedProps => {
  return {
    data: getSortedOutcomesFromOutcomeWorkflowSet(
      state,
      state.workflow.outcomeworkflow_set
    ),
    workflow: state.workflow
  }
}

export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapEditViewStateToProps,
  null
)(OutcomeEditViewUnconnected)
