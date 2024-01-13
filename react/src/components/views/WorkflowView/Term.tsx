import * as React from 'react'
import { connect } from 'react-redux'
import { TitleText } from '@cfUIComponents'
import { WeekUnconnected, WeekUnconnectedPropsType } from './Week'
import NodeWeek from './NodeWeek'
import { getTermByID, TermByIDType } from '@cfFindState'
import $ from 'jquery'
import { AppState } from '@cfRedux/type'

type OwnProps = {
  objectID: number
} & WeekUnconnectedPropsType
type ConnectedProps = TermByIDType
type PropsType = OwnProps & ConnectedProps

/**
 * The term variation of a week, used in the program level or in the
 * condensed view. This displays the nodes side by side.
 */
class Term extends WeekUnconnected<PropsType> {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  makeDragAndDrop() {
    //Makes the nodeweeks in the node block draggable
    this.makeSortableNode(
      $(this.node_block.current)
        .children()
        .children('.node-week')
        .not('.ui-draggable'),
      this.props.objectID,
      'nodeweek',
      '.node-week',
      false,
      // @ts-ignore
      [200, 1],
      null,
      '.node'
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const node_blocks = []
    for (let i = 0; i < this.props.column_order.length; i++) {
      const col = this.props.column_order[i]
      const nodeweeks = []
      for (let j = 0; j < data.nodeweek_set.length; j++) {
        const nodeweek = data.nodeweek_set[j]
        if (this.props.nodes_by_column[col].indexOf(nodeweek) >= 0) {
          nodeweeks.push(
            <NodeWeek
              key={nodeweek}
              objectID={nodeweek}
              parentID={data.id}
              renderer={this.props.renderer}
              column_order={this.props.column_order}
            />
          )
        }
      }
      if (nodeweeks.length == 0)
        nodeweeks.push(
          <div
            className="node-week placeholder"
            style={{ height: '100%' }}
          ></div>
        )
      node_blocks.push(
        <div
          className={'node-block term column-' + col}
          id={this.props.objectID + '-node-block-column-' + col}
          key={col}
        >
          {nodeweeks}
        </div>
      )
    }

    let css_class = 'week'
    if (data.is_strategy) css_class += ' strategy'
    if (data.lock) css_class += ' locked locked-' + data.lock.user_id
    if (data.is_dropped) css_class += ' dropped'

    const style = {
      border: data.lock ? '2px solid ' + data.lock.user_colour : undefined
    }

    const dropIcon = data.is_dropped ? 'droptriangleup' : 'droptriangledown'

    const mouseover_actions = []
    if (!this.props.renderer.read_only) {
      mouseover_actions.push(this.addInsertSibling(data))
      mouseover_actions.push(this.addDuplicateSelf(data))
      mouseover_actions.push(this.addDeleteSelf(data))
    }
    if (this.props.renderer.view_comments) {
      mouseover_actions.push(this.addCommenting())
    }

    // PORTAL
    this.addEditable(data)

    return (
      <div
        style={style}
        className={css_class}
        ref={this.mainDiv}
        onClick={(evt) =>
          this.props.renderer.selection_manager.changeSelection(evt, this)
        }
      >
        <div className="mouseover-container-bypass">
          <div className="mouseover-actions">{mouseover_actions}</div>
        </div>
        <TitleText
          text={data.title}
          defaultText={data.week_type_display + ' ' + (this.props.rank + 1)}
        />
        <div
          className="node-block"
          id={this.props.objectID + '-node-block'}
          ref={this.node_block}
        >
          {node_blocks}
        </div>
        <div
          className="week-drop-row hover-shade"
          onClick={this.toggleDrop.bind(this)}
        >
          <div className="node-drop-side node-drop-left"></div>
          <div className="node-drop-middle">
            <img src={COURSEFLOW_APP.config.icon_path + dropIcon + '.svg'} />
          </div>
          <div className="node-drop-side node-drop-right"></div>
        </div>
        {/*{this.addEditable(data)}* // @todo this is a portal and shouldn't be returned in a render function */}
      </div>
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  return getTermByID(state, ownProps.objectID)
}
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(Term)
