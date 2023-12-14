import * as React from 'react'
import { Provider, connect } from 'react-redux'
import { changeField, toggleObjectSet } from '../../../../redux/Reducers.js'

/**
 * The view tab of the right side bar for workflows. Allows object sets
 * to be toggled, and also changes the table type if this is a view of the
 * workflow that allows this.
 */
class ViewBarUnconnected extends React.Component {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  toggleHidden(id, hidden) {
    this.props.dispatch(toggleObjectSet(id, hidden))
  }

  changeSort(evt) {
    this.props.dispatch(
      changeField(this.props.data.id, 'workflow', {
        outcomes_sort: evt.target.value
      })
    )
  }
  changeTableType(evt) {
    this.props.dispatch(
      changeField(this.props.data.id, 'workflow', {
        table_type: evt.target.value
      })
    )
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    let sort_block
    if (
      this.props.renderer.view_type == 'outcometable' ||
      this.props.renderer.view_type == 'horizontaloutcometable'
    ) {
      let table_type_value = data.table_type || 0
      let sort_type = (
        <div className="node-bar-sort-block">
          {this.props.renderer.outcome_sort_choices.map((choice) => (
            <div>
              <input
                disabled={
                  table_type_value == 1 ||
                  (data.type == 'program' && choice.type > 1)
                }
                type="radio"
                id={'sort_type_choice' + choice.type}
                name={'sort_type_choice' + choice.type}
                value={choice.type}
                checked={data.outcomes_sort == choice.type}
                onChange={this.changeSort.bind(this)}
              />
              <label htmlFor={'sort_type_choice' + choice.type}>
                {choice.name}
              </label>
            </div>
          ))}
        </div>
      )
      let table_type = (
        <div className="node-bar-sort-block">
          <div>
            <input
              type="radio"
              id={'table_type_table'}
              name="table_type_table"
              value={0}
              checked={table_type_value == 0}
              onChange={this.changeTableType.bind(this)}
            />
            <label htmlFor="table_type_table">{gettext('Table Style')}</label>
          </div>
          <div>
            <input
              type="radio"
              id={'table_type_matrix'}
              name="table_type_matrix"
              value={1}
              checked={table_type_value == 1}
              onChange={this.changeTableType.bind(this)}
            />
            <label htmlFor="table_type_matrix">
              {gettext('Competency Matrix Style')}
            </label>
          </div>
        </div>
      )
      sort_block = (
        <div>
          <h4>{gettext('Sort Nodes')}:</h4>
          {sort_type}
          <h4>{gettext('Table Type')}:</h4>
          {table_type}
        </div>
      )
    }

    let sets = (
      <div className="node-bar-sort-block">
        {this.props.object_sets
          .sort((a, b) => {
            let x = a.term
            let y = b.term
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
        <h3>{gettext('View options')}</h3>
        <hr />
        {sort_block}
        <h4>{gettext('Object Sets')}</h4>
        {sets}
      </div>
    )
  }
}
export default connect(
  (state) => ({
    object_sets: state.objectset
  }),
  null
)(ViewBarUnconnected)
