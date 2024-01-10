import * as React from 'react'

/**
 * The view tab for the right side bar is a bit
 * different in the comparison view, because it has to
 * control the object sets across all workflows
 */
export default class ComparisonViewBar extends React.Component {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  toggleHidden(id) {
    this.props.toggleObjectSet(id)
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
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
                onChange={this.toggleHidden.bind(this, set.id)}
              />
              <label htmlFor={'set' + set.id}>{set.title}</label>
            </div>
          ))}
      </div>
    )
    return (
      <div id="node-bar-workflow" className="right-panel-inner">
        <h4>{window.gettext('Object Sets') + ':'}</h4>
        {sets}
      </div>
    )
  }
}
