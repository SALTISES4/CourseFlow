import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum'
import {
  EditableComponentWithSortingProps,
  EditableComponentWithSortingState
} from '@cfEditableComponents/EditableComponentWithSorting'
import EditableComponentWithSorting from '@cfEditableComponents/EditableComponentWithSorting'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import ColumnWorkflow from '@cfViews/components/ColumnWorkflow'
import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import * as React from 'react'
import { connect } from 'react-redux'

import WeekWorkflow from './components/WeekWorkflow'
import WorkflowLegend from './components/WorkflowLegend'
// import $ from 'jquery'

type ConnectedProps = {
  data: AppState['workflow']
  objectSets: AppState['objectset']
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
      this.props.objectId,
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
      this.props.objectId,
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
      this.context.editableMethods.microUpdate(
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
      this.context.editableMethods.microUpdate(
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
    console.log('data in workflow view ')
    console.log(data)

    const columnworkflows = data.columnworkflowSet?.map(
      (columnworkflow, index) => (
        <ColumnWorkflow
          key={`columnworkflow-${columnworkflow}`}
          objectId={columnworkflow}
          parentID={data.id}
        />
      )
    )
    const weekworkflows = data.weekworkflowSet?.map((weekworkflow, index) => (
      <WeekWorkflow
        condensed={data.condensed}
        key={`weekworkflow-${weekworkflow}`}
        objectId={weekworkflow}
        parentID={data.id}
      />
    ))

    let cssClass = 'workflow-details'
    if (data.condensed) cssClass += ' condensed'

    // We render an svg canvas in front of the rest of
    // the workflow for drawing node ports and links
    return (
      <div className={cssClass}>
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
  objectSets: state.objectset,
  week: state.week,
  node: state.node,
  outcome: state.outcome
})

const WorkflowView = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(WorkflowViewUnconnected)

export default WorkflowView
