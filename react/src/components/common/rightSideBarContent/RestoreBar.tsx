import * as React from 'react'
import { connect } from 'react-redux'
import RestoreBarItem from '@cfCommonComponents/rightSideBarContent/NodeBar/components/RestoreBarItem'
import { AppState } from '@cfRedux/types/type'
import { CfObjectType } from '@cfModule/types/enum'
// import $ from 'jquery'

/**
 * The delete/restore tab of the right sidebar in the workflow view.
 */

type ConnectedProps = {
  weeks: any
  columns: any
  nodes: any
  outcomes: any
  nodelinks: any
}
type OwnProps = any
type PropsType = ConnectedProps & OwnProps

class RestoreBarUnconnected extends React.Component<PropsType> {
  private objectType: CfObjectType
  constructor(props) {
    super(props)
    this.objectType = CfObjectType.WORKFLOW // @todo check addEditable
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/

  componentDidMount() {
    this.checkVisible()
  }
  componentDidUpdate() {
    this.checkVisible()
  }
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  checkVisible() {
    if (
      this.props.nodes.length == 0 &&
      this.props.weeks.length == 0 &&
      this.props.columns.length == 0 &&
      this.props.outcomes.length == 0 &&
      this.props.nodelinks.length == 0
    ) {
      $("a[href='#restore-bar']").parent().addClass('hidden')
    } else {
      $("a[href='#restore-bar']").parent().removeClass('hidden')
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const columns = this.props.columns.map((column) => (
      <RestoreBarItem
        key={column.id}
        objectType="column"
        data={column}
        // renderer={this.props.renderer}
      />
    ))
    const weeks = this.props.weeks.map((week) => (
      <RestoreBarItem
        key={week.id}
        objectType="week"
        data={week}
        // renderer={this.props.renderer}
      />
    ))
    const nodes = this.props.nodes.map((node) => (
      <RestoreBarItem
        key={node.id}
        objectType="node"
        data={node}
        // renderer={this.props.renderer}
      />
    ))
    const outcomes = this.props.outcomes.map((outcome) => (
      <RestoreBarItem
        key={outcome.id}
        objectType="outcome"
        data={outcome}
        // renderer={this.props.renderer}
      />
    ))
    const nodelinks = this.props.nodelinks.map((nodelink) => (
      <RestoreBarItem
        key={nodelink.id}
        objectType="nodelink"
        data={nodelink}
        // renderer={this.props.renderer}
      />
    ))

    return (
      <div id="restore-bar-workflow" className="right-panel-inner">
        <h3>{window.gettext('Restore items')}</h3>
        <hr />
        <h4>{window.gettext('Nodes')}</h4>
        <div className="node-bar-column-block">{nodes}</div>
        <hr />
        <h4>{window.gettext('Weeks')}</h4>
        <div className="node-bar-column-block">{weeks}</div>
        <hr />
        <h4>{window.gettext('Columns')}</h4>
        <div className="node-bar-column-block">{columns}</div>
        <hr />
        <h4>{window.gettext('Outcomes')}</h4>
        <div className="node-bar-column-block">{outcomes}</div>
        <hr />
        <h4>{window.gettext('Node Links')}</h4>
        <div className="node-bar-column-block">{nodelinks}</div>
      </div>
    )
  }
}
const mapRestoreBarStateToProps = (state: AppState): ConnectedProps => ({
  weeks: state.week.filter((x) => x.deleted),
  columns: state.column.filter((x) => x.deleted),
  nodes: state.node.filter((x) => x.deleted),
  outcomes: state.outcome.filter((x) => x.deleted),
  nodelinks: state.nodelink.filter((x) => x.deleted)
})
export default connect(mapRestoreBarStateToProps, null)(RestoreBarUnconnected)
