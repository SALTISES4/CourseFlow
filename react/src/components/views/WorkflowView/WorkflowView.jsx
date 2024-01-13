import * as React from 'react'
import { connect } from 'react-redux'
import { EditableComponentWithSorting } from '@cfCommonComponents/extended'
import ColumnWorkflow from './ColumnWorkflow'
import WeekWorkflow from './WeekWorkflow'
import * as Utility from '@cfUtility'
import WorkflowLegend from './WorkflowLegend'
import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import ActionCreator from '@cfRedux/ActionCreator'
// import $ from 'jquery'

/**
 * The workflow view with drag and drop nodes/weeks/columns
 */
class WorkflowViewUnconnected extends EditableComponentWithSorting {
  constructor(props) {
    super(props)
    this.objectType = 'workflow'
    this.state = {}
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

  sortableMovedFunction(id, new_position, type, new_parent, child_id) {
    if (type === 'columnworkflow') {
      this.props.renderer.micro_update(
        ActionCreator.moveColumnWorkflow(id, new_position, new_parent, child_id)
      )
      insertedAt(
        this.props.renderer,
        child_id,
        'column',
        new_parent,
        'workflow',
        new_position,
        'columnworkflow'
      )
    }
    if (type === 'weekworkflow') {
      this.props.renderer.micro_update(
        ActionCreator.moveWeekWorkflow(id, new_position, new_parent, child_id)
      )
      insertedAt(
        this.props.renderer,
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
    const renderer = this.props.renderer
    const columnworkflows = data.columnworkflow_set.map(
      (columnworkflow, index) => (
        <ColumnWorkflow
          key={`columnworkflow-${index}`}
          objectID={columnworkflow}
          parentID={data.id}
          renderer={renderer}
        />
      )
    )
    const weekworkflows = data.weekworkflow_set.map((weekworkflow, index) => (
      <WeekWorkflow
        condensed={data.condensed}
        key={`weekworkflow-${index}`}
        objectID={weekworkflow}
        parentID={data.id}
        renderer={renderer}
      />
    ))

    let css_class = 'workflow-details'
    if (data.condensed) css_class += ' condensed'

    // We render an svg canvas in front of the rest of
    // the workflow for drawing node ports and links
    return (
      <div className={css_class}>
        <WorkflowLegend renderer={renderer} />
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
const mapWorkflowStateToProps = (state) => ({
  data: state.workflow,
  object_sets: state.objectset,
  week: state.week,
  node: state.node,
  outcome: state.outcome
})
export default connect(mapWorkflowStateToProps, null)(WorkflowViewUnconnected)
