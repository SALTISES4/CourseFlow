import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import EditableComponentWithSorting, {
  EditableComponentWithSortingProps,
  EditableComponentWithSortingState
} from '@cfEditableComponents/EditableComponentWithSorting'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import ColumnWorkflow from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/column/ColumnWorkflow'
import WeekWorkflow from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/week/WeekWorkflow'
import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import * as React from 'react'
import { connect } from 'react-redux'

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
 * ...
 * what view is this?
 */
class WorkflowEditViewUnconnected extends EditableComponentWithSorting<
  PropsType,
  StateProps
> {
  static contextType = WorkflowConfigContext
  declare context: React.ContextType<typeof WorkflowConfigContext>

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
    ThemeHelper.triggerHandlerEach($('.week .node'), 'component-updated')
  }

  sortableMovedFunction(
    id: number,
    newPosition: number,
    type: string,
    newParent: number,
    childId: number
  ) {
    if (type === 'columnworkflow') {
      this.context.editableMethods.microUpdate(
        ActionCreator.moveColumnWorkflow(id, newPosition, newParent, childId)
      )
      insertedAt(
        this.context.selectionManager,
        childId,
        'column',
        newParent,
        'workflow',
        newPosition,
        'columnworkflow'
      )
    }
    if (type === 'weekworkflow') {
      this.context.editableMethods.microUpdate(
        ActionCreator.moveWeekWorkflow(id, newPosition, newParent, childId)
      )
      insertedAt(
        this.context.selectionManager,
        childId,
        'week',
        newParent,
        'workflow',
        newPosition,
        'weekworkflow'
      )
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    const columnworkflows = data.columnworkflowSet?.map(
      (columnworkflow, index) => (
        <ColumnWorkflow
          key={`columnworkflow-${columnworkflow}`}
          objectId={columnworkflow}
          parentId={data.id}
        />
      )
    )
    const weekworkflows = data.weekworkflowSet?.map((weekworkflow, index) => (
      <WeekWorkflow
        condensed={data.condensed}
        key={`weekworkflow-${weekworkflow}`}
        objectId={weekworkflow}
        parentId={data.id}
      />
    ))

    let cssClass = 'workflow-details'
    if (data.condensed) {
      cssClass += ' condensed'
    }

    // We render an svg canvas in front of the rest of
    // the workflow for drawing node ports and links
    return (
      <div className={cssClass}>
        <div className="column-row" id={data.id + '-column-block'}>
          {columnworkflows}
        </div>
        <div className="week-block" id={data.id + '-week-block'}>
          {weekworkflows}
        </div>
        {/*
        PLACEHOLDER PORTAL TARGET FOR ALL KINDS OF STUFF
        */}
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

const WorkflowEditView = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(WorkflowEditViewUnconnected)

export default WorkflowEditView
