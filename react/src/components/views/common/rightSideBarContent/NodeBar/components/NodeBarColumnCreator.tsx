import { _t } from '@cf/utility/Utility.class'
import {
  NodeBarColumnUnconnected,
  NodeBarColumnUnconnectedType
} from '@cfViews/common/rightSideBarContent/NodeBar/components/NodeBarColumn'
import * as React from 'react'

// type PropsType = NodeBarColumnUnconnectedType
/**
 * As the NodeBarColumn component, but creates a new column.
 * @todo having a component class that is both connected and unconnected being extended from is too complicated
 * to type properly
 * simplify this
 */
class NodeBarColumnCreator extends NodeBarColumnUnconnected<NodeBarColumnUnconnectedType> {
  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeDraggable()

    // @todo HACK, this is being used to bypass react and pass information around the DOM

    // @ts-ignore
    $(this.mainDiv.current)[0].dataDraggable = {
      column: null,
      columnType: this.props.columnType
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const choice = this.props?.columnChoices?.find(
      (columnChoice) => columnChoice.type === this.props.columnType
    )
    const title = choice ? `New ${choice.name}` : 'New'

    return (
      <div
        className="new-node new-column node-bar-column node-bar-sortable"
        ref={this.mainDiv}
      >
        {title}
      </div>
    )
  }
}
export default NodeBarColumnCreator
