import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { _t } from '@cf/utility/Utility.class'
import { WorkflowViewType } from '@cfPages/Workspace/Workflow/types'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import * as React from 'react'
import { DispatchProp, connect } from 'react-redux'

type ConnectedProps = {
  objectSets: any
}
type OwnProps = {
  data: any
}
type PropsType = DispatchProp & ConnectedProps & OwnProps

const choices = COURSEFLOW_APP.globalContextData.workflowChoices

/**
 * The view tab of the right side bar for workflows. Allows object sets
 * to be toggled, and also changes the table type if this is a view of the
 * workflow that allows this.
 */
class ViewBarUnconnected extends React.Component<PropsType> {
  static contextType = WorkflowConfigContext
  declare context: React.ContextType<typeof WorkflowConfigContext>

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  toggleHidden(id, hidden) {
    this.props.dispatch(ActionCreator.toggleObjectSet(id, hidden))
  }

  changeSort(evt) {
    this.props.dispatch(
      ActionCreator.changeField(this.props.data.id, 'workflow', {
        outcomesSort: evt.target.value
      })
    )
  }
  changeTableType(evt) {
    this.props.dispatch(
      ActionCreator.changeField(this.props.data.id, 'workflow', {
        tableType: evt.target.value
      })
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let sortBlock
    if (
      this.context.workflowView === WorkflowViewType.OUTCOME_TABLE ||
      this.context.workflowView === WorkflowViewType.HORIZONTAL_OUTCOME_TABLE
    ) {
      const tableTypeValue = data.tableType || 0
      const sortType = (
        <div className="node-bar-sort-block">
          {choices.outcomeSortChoices.map((choice, index) => (
            <div key={index}>
              <input
                disabled={
                  tableTypeValue === 1 ||
                  // @ts-ignore
                  (data.type === 'program' && choice.type > 1)
                }
                type="radio"
                id={'sortType_choice' + choice.type}
                name={'sortType_choice' + choice.type}
                value={choice.type}
                checked={data.outcomesSort === choice.type}
                onChange={this.changeSort.bind(this)}
              />
              <label htmlFor={'sortType_choice' + choice.type}>
                {choice.name}
              </label>
            </div>
          ))}
        </div>
      )
      const tableType = (
        <div className="node-bar-sort-block">
          <div>
            <input
              type="radio"
              id={'tableType_table'}
              name="tableType_table"
              value={0}
              checked={tableTypeValue === 0}
              onChange={this.changeTableType.bind(this)}
            />
            <label htmlFor="tableType_table">{_t('Table Style')}</label>
          </div>
          <div>
            <input
              type="radio"
              id={'tableType_matrix'}
              name="tableType_matrix"
              value={1}
              checked={tableTypeValue === 1}
              onChange={this.changeTableType.bind(this)}
            />
            <label htmlFor="tableType_matrix">
              {_t('Competency Matrix Style')}
            </label>
          </div>
        </div>
      )
      sortBlock = (
        <div>
          <h4>{_t('Sort Nodes')}:</h4>
          {sortType}
          <h4>{_t('Table Type')}:</h4>
          {tableType}
        </div>
      )
    }

    const sets = (
      <div className="node-bar-sort-block">
        {this.props.objectSets
          .sort((a, b) => {
            const x = a.term
            const y = b.term
            if (x < y) {
              return -1
            }
            if (x > y) {
              return 1
            }
            return 0
          })
          .map((set, index) => (
            <div key={index}>
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
        {sortBlock}
        <h4>{_t('Object Sets')}</h4>
        {sets}
      </div>
    )
  }
}
const mapStateToProps = (state: AppState): ConnectedProps => ({
  objectSets: state.objectset
})

export default connect<ConnectedProps, DispatchProp, OwnProps, AppState>(
  mapStateToProps,
  null
)(ViewBarUnconnected)
