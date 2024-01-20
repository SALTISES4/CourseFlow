import * as React from 'react'
import { connect } from 'react-redux'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
import { ViewType } from '@cfModule/types/enum'

type ConnectedProps = {
  object_sets: any
}
type OwnProps = {
  data: any
  // renderer: any
  dispatch?: any
}
type PropsType = ConnectedProps & OwnProps

/**
 * The view tab of the right side bar for workflows. Allows object sets
 * to be toggled, and also changes the table type if this is a view of the
 * workflow that allows this.
 */
class ViewBarUnconnected extends React.Component<PropsType> {
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
      this.context.view_type === ViewType.OUTCOMETABLE ||
      this.context.view_type === ViewType.HORIZONTALOUTCOMETABLE
    ) {
      const table_type_value = data.table_type || 0
      const sort_type = (
        <div className="node-bar-sort-block">
          {
            // @ts-ignore
            this.context.outcome_sort_choices.map((choice) => (
              <div>
                <input
                  disabled={
                    table_type_value === 1 ||
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
            ))
          }
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
            <label htmlFor="table_type_table">
              {window.gettext('Table Style')}
            </label>
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
              {window.gettext('Competency Matrix Style')}
            </label>
          </div>
        </div>
      )
      sort_block = (
        <div>
          <h4>{window.gettext('Sort Nodes')}:</h4>
          {sort_type}
          <h4>{window.gettext('Table Type')}:</h4>
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
        <h3>{window.gettext('View options')}</h3>
        <hr />
        {sort_block}
        <h4>{window.gettext('Object Sets')}</h4>
        {sets}
      </div>
    )
  }
}
const mapStateToProps = (state: AppState): ConnectedProps => ({
  object_sets: state.objectset
})

export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(ViewBarUnconnected)
