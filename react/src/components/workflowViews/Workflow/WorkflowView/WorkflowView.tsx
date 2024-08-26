import * as React from 'react'
import { connect } from 'react-redux'
import EditableComponentWithSorting from '@cfEditableComponents/EditableComponentWithSorting'
import ColumnWorkflow from './ColumnWorkflow'
import WeekWorkflow from './WeekWorkflow'
import * as Utility from '@cfUtility'
import WorkflowLegend from './WorkflowLegend'
import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import {
  EditableComponentWithSortingProps,
  EditableComponentWithSortingState
} from '@cfEditableComponents/EditableComponentWithSorting'
import { CfObjectType } from '@cfModule/types/enum'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
// import $ from 'jquery'

type ConnectedProps = {
  data: AppState['workflow']
  object_sets: AppState['objectset']
  week: AppState['week']
  node: AppState['node']
  outcome: AppState['outcome']
}
type OwnProps = EditableComponentWithSortingProps
type StateProps = EditableComponentWithSortingState
type PropsType = ConnectedProps & OwnProps

/**
 * The workflow view with drag and drop nodes/weeks/columns
 */
class WorkflowViewUnconnected extends EditableComponentWithSorting<
  PropsType,
  StateProps
> {
  static contextType = WorkFlowConfigContext
  declare context: React.ContextType<typeof WorkFlowConfigContext>

  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.WORKFLOW
    this.state = {} as StateProps
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
  makeDragAndDrop() {
    this.makeSortableNode(
      $('.column-row').children('.column-workflow').not('.ui-draggable'),
      this.props.objectID,
      'columnworkflow',
      '.column-workflow',
      // @ts-ignore
      'x',
      false,
      null,
      '.column',
      '.column-row'
    )
    this.makeSortableNode(
      $('.week-block').children('.week-workflow').not('.ui-draggable'),
      this.props.objectID,
      'weekworkflow',
      '.week-workflow',
      // @ts-ignore
      'y',
      false,
      null,
      '.week',
      '.week-block'
    )
  }

  stopSortFunction() {
    Utility.triggerHandlerEach($('.week .node'), 'component-updated')
  }

  sortableMovedFunction(
    id: number,
    new_position: number,
    type: string,
    new_parent: number,
    child_id: number
  ) {
    if (type === 'columnworkflow') {
      console.log('columnworkflow sortablemoved', id)
      this.context.editableMethods.micro_update(
        ActionCreator.moveColumnWorkflow(id, new_position, new_parent, child_id)
      )
      insertedAt(
        this.context.selectionManager,
        child_id,
        'column',
        new_parent,
        'workflow',
        new_position,
        'columnworkflow'
      )
    }
    if (type === 'weekworkflow') {
      this.context.editableMethods.micro_update(
        ActionCreator.moveWeekWorkflow(id, new_position, new_parent, child_id)
      )
      insertedAt(
        this.context.selectionManager,
        child_id,
        'week',
        new_parent,
        'workflow',
        new_position,
        'weekworkflow'
      )
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const columnworkflows = data.columnworkflow_set.map(
      (columnworkflow, index) => (
        <ColumnWorkflow
          key={`columnworkflow-${columnworkflow}`}
          objectID={columnworkflow}
          parentID={data.id}
          // renderer={renderer}
        />
      )
    )
    const weekworkflows = data.weekworkflow_set.map((weekworkflow, index) => (
      <WeekWorkflow
        condensed={data.condensed}
        key={`weekworkflow-${weekworkflow}`}
        objectID={weekworkflow}
        parentID={data.id}
        // renderer={renderer}
      />
    ))

    let css_class = 'workflow-details'
    if (data.condensed) css_class += ' condensed'

    // We render an svg canvas in front of the rest of
    // the workflow for drawing node ports and links
    return (
      <div className={css_class}>
        <WorkflowLegend />
        <div className="column-row" id={data.id + '-column-block'}>
          {columnworkflows}
        </div>
        <div className="week-block" id={data.id + '-week-block'}>
          {weekworkflows}
        </div>
        <svg className="workflow-canvas" width="100%" height="100%">
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>
        </svg>
      </div>
    )
  }
}
const mapStateToProps = (state: AppState): ConnectedProps => ({
  data: state.workflow,
  object_sets: state.objectset,
  week: state.week,
  node: state.node,
  outcome: state.outcome
})

const WorkflowView = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(WorkflowViewUnconnected)

export default WorkflowView
