import { _t } from '@cf/utility/utilityFunctions'
import * as Constants from '@cfConstants'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfEditableComponents/ComponentWithToggleDrop'
import { TGetColumnByID, getColumnByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'
// import $ from 'jquery'

type ConnectedProps = TGetColumnByID
type OwnProps = {
  // parentID?: number // are these optional? see  react/src/components/common/rightSideBarContent/NodeBar/components/NodeBarColumnWorkflow.tsx
  // throughParentID?: number // are these optional? see  react/src/components/common/rightSideBarContent/NodeBar/components/NodeBarColumnWorkflow.tsx
  columnChoices?: any
  columnType?: any
} & ComponentWithToggleProps
export type NodeBarColumnUnconnectedType = OwnProps

/**
 * Can be dragged and dropped into the workflow space to create
 * a node of the corresponding column. The actual dropping functionality
 * is handled in the Week component, not here.
 */
export class NodeBarColumnUnconnected<
  P extends OwnProps
> extends ComponentWithToggleDrop<P> {
  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeDraggable()
    // @todo dataDraggable undefined
    // @ts-ignore
    $(this.mainDiv.current)[0].dataDraggable = {
      column: this.props.data.id,
      columnType: null
    }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  makeDraggable() {
    const draggable_selector = 'node-week'
    const draggable_type = 'nodeweek'

    $(this.mainDiv?.current).draggable({
      helper: (_e: any, _item: any) => {
        const helper = $(document.createElement('div'))
        helper.addClass('node-ghost')
        helper.appendTo(document.body)
        return helper
      },
      cursor: 'move',
      cursorAt: { top: 20, left: 100 },
      distance: 10,
      start: (_e, _ui) => {
        $('.workflow-canvas').addClass('dragging-' + draggable_type)
        $(draggable_selector).addClass('dragging')
      },
      stop: (_e, _ui) => {
        $('.workflow-canvas').removeClass('dragging-' + draggable_type)
        $(draggable_selector).removeClass('dragging')
      }
    })
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const title = data ? data.title || data.columnTypeDisplay : undefined

    return (
      <div
        dangerouslySetInnerHTML={{ __html: title }}
        className={
          'new-node node-bar-column node-bar-sortable column-' +
          this.props.objectId
        }
        ref={this.mainDiv}
        style={{ backgroundColor: Constants.getColumnColour(data) }}
      />
    )
  }
}

const mapColumnStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TGetColumnByID => {
  return getColumnByID(state, ownProps.objectId)
}
const NodeBarColumn = connect<ConnectedProps, object, OwnProps, AppState>(
  mapColumnStateToProps,
  null
)(NodeBarColumnUnconnected)

export default NodeBarColumn
