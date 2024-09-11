import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { WorkflowViewType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import * as React from 'react'
import { DispatchProp, connect } from 'react-redux'

type ConnectedProps = {
  object_sets: any
}
type OwnProps = {
  data: any
}
type PropsType = DispatchProp & ConnectedProps & OwnProps

const choices = COURSEFLOW_APP.globalContextData.workflow_choices

/**
 * The view tab of the right side bar for workflows. Allows object sets
 * to be toggled, and also changes the table type if this is a view of the
 * workflow that allows this.
 */
class ViewBarUnconnected extends React.Component<PropsType> {
  static contextType = WorkFlowConfigContext
  declare context: React.ContextType<typeof WorkFlowConfigContext>

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  toggleHidden(id, hidden) {
    this.props.dispatch(ActionCreator.toggleObjectSet(id, hidden))
  }

  changeSort(evt) {
    this.props.dispatch(
      ActionCreator.changeField(this.props.data.id, 'workflow', {
        outcomes_sort: evt.target.value
      })
    )
  }
  changeTableType(evt) {
    this.props.dispatch(
      ActionCreator.changeField(this.props.data.id, 'workflow', {
        table_type: evt.target.value
      })
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let sort_block
    if (
      this.context.workflowView === WorkflowViewType.OUTCOMETABLE ||
      this.context.workflowView === WorkflowViewType.HORIZONTALOUTCOMETABLE
    ) {
      const table_type_value = data.table_type || 0
      const sort_type = (
        <div className="node-bar-sort-block">
          {choices.outcome_sort_choices.map((choice) => (
            <div>
              <input
                disabled={
                  table_type_value === 1 ||
                  // @ts-ignore
                  (data.type === 'program' && choice.type > 1)
                }
                type="radio"
                id={'sort_type_choice' + choice.type}
                name={'sort_type_choice' + choice.type}
                value={choice.type}
                checked={data.outcomes_sort === choice.type}
                onChange={this.changeSort.bind(this)}
              />
              <label htmlFor={'sort_type_choice' + choice.type}>
                {choice.name}
              </label>
            </div>
          ))}
        </div>
      )
      const table_type = (
        <div className="node-bar-sort-block">
          <div>
            <input
              type="radio"
              id={'table_type_table'}
              name="table_type_table"
              value={0}
              checked={table_type_value === 0}
              onChange={this.changeTableType.bind(this)}
            />
            <label htmlFor="table_type_table">{_t('Table Style')}</label>
          </div>
          <div>
            <input
              type="radio"
              id={'table_type_matrix'}
              name="table_type_matrix"
              value={1}
              checked={table_type_value === 1}
              onChange={this.changeTableType.bind(this)}
            />
            <label htmlFor="table_type_matrix">
              {_t('Competency Matrix Style')}
            </label>
          </div>
        </div>
      )
      sort_block = (
        <div>
          <h4>{_t('Sort Nodes')}:</h4>
          {sort_type}
          <h4>{_t('Table Type')}:</h4>
          {table_type}
        </div>
      )
    }

    const sets = (
      <div className="node-bar-sort-block">
        {this.props.object_sets
          .sort((a, b) => {
            const x = a.term
            const y = b.term
            if (x < y) return -1
            if (x > y) return 1
            return 0
          })
          .map((set) => (
            <div>
              <input
                type="checkbox"
                id={'set' + set.id}
                value={set.id}
                checked={!set.hidden}
                onChange={this.toggleHidden.bind(this, set.id, !set.hidden)}
              />
              <label htmlFor={'set' + set.id}>{set.title}</label>
            </div>
          ))}
      </div>
    )

    return (
      <div id="node-bar-workflow" className="right-panel-inner">
        <h3>{_t('View options')}</h3>
        <hr />
        {sort_block}
        <h4>{_t('Object Sets')}</h4>
        {sets}
      </div>
    )
  }
}
const mapStateToProps = (state: AppState): ConnectedProps => ({
  object_sets: state.objectset
})

export default connect<ConnectedProps, DispatchProp, OwnProps, AppState>(
  mapStateToProps,
  null
)(ViewBarUnconnected)
