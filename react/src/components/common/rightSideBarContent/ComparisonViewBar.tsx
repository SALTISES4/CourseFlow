import * as React from 'react'
import { ObjectSet } from '@cfRedux/type'

/**
 * The view tab for the right side bar is a bit
 * different in the comparison view, because it has to
 * control the object sets across all workflows
 */

type PropsType = {
  objectSets: ObjectSet[] // not sure of this type
  toggleObjectSet: (id: number) => void
}
class ComparisonViewBar extends React.Component<PropsType> {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  toggleHidden(id: number) {
    this.props.toggleObjectSet(id)
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  Sets = () => (
    <div className="node-bar-sort-block">
      {this.props.objectSets
        .sort((a, b) => {
          const x = a.term
          const y = b.term
          if (x < y) return -1
          if (x > y) return 1
          return 0
        })
        .map((set, index) => (
          <div key={index}>
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

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    return (
      <div id="node-bar-workflow" className="right-panel-inner">
        <h4>{window.gettext('Object Sets') + ':'}</h4>
        <this.Sets />
      </div>
    )
  }
}

export default ComparisonViewBar
