import * as React from 'react'
import { connect } from 'react-redux'
// @components
import { EditableComponentWithSorting } from '@cfParentComponents'
import { getSortedOutcomesFromOutcomeWorkflowSet } from '@cfFindState'
import Outcome from './Outcome'
import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import { newOutcomeQuery } from '@XMLHTTP/APIFunctions'
import ActionCreator from '@cfRedux/ActionCreator.ts'
// import $ from 'jquery'

/**
 * The view of a workflow in which the outcomes can be added,
 * edited, removed
 */
export class OutcomeEditViewUnconnected extends EditableComponentWithSorting {
  constructor(props) {
    super(props)
    this.objectType = 'workflow'
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
  getAddNew(objectset) {
    let add_new_outcome
    if (!this.props.renderer.read_only)
      add_new_outcome = (
        <div
          id="add-new-outcome"
          className="menu-create hover-shade"
          onClick={this.addNew.bind(this, objectset)}
        >
          <img
            className="create-button"
            src={COURSEFLOW_APP.config.icon_path + 'add_new_white.svg'}
          />
          <div>{window.gettext('Add new')}</div>
        </div>
      )
    return add_new_outcome
  }

  stopSortFunction() {}

  makeDragAndDrop() {
    this.makeSortableNode(
      $(this.mainDiv.current).find('.outcome-workflow').not('ui-draggable'),
      this.props.objectID,
      'outcomeworkflow',
      '.outcome-workflow'
    )
    if (this.props.data.depth === 0) this.makeDroppable()
  }

  sortableMovedFunction(id, new_position, type, new_parent, child_id) {
    this.props.renderer.micro_update(
      ActionCreator.moveOutcomeWorkflow(
        id,
        new_position,
        this.props.workflow.id,
        child_id
      )
    )
    insertedAt(
      this.props.renderer,
      child_id,
      'outcome',
      this.props.workflow.id,
      'workflow',
      new_position,
      'outcomeworkflow'
    )
  }

  addNew(objectset) {
    newOutcomeQuery(this.props.workflow.id, objectset.id)
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let outcomes = data.map((category) => (
      <div className="outcome-category">
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
                  renderer={this.props.renderer}
                  show_horizontal={true}
                />
              </div>
            )
          })}
          {this.getAddNew(category.objectset)}
        </div>
      </div>
    ))
    if (outcomes.length === 0)
      outcomes = [
        <div className="emptytext">
          {window.gettext(
            'Here you can add and edit outcomes for the current workflow. They will then be available in the Workflow view to tag nodes in the Outcomes tab of the sidebar.'
          )}
        </div>,
        this.getAddNew({})
      ]

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
const mapEditViewStateToProps = (state) => ({
  data: getSortedOutcomesFromOutcomeWorkflowSet(
    state,
    state.workflow.outcomeworkflow_set
  ),
  workflow: state.workflow
})
export default connect(
  mapEditViewStateToProps,
  null
)(OutcomeEditViewUnconnected)
