import * as React from 'react'
import { connect } from 'react-redux'
import { restoreSelf, deleteSelf } from '@XMLHTTP/PostFunctions'
import Component from '@cfParentComponents/Component'

/**
 * The delete/restore tab of the right sidebar in the workflow view.
 */

class RestoreBarUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'workflow'
  }

  render() {
    let columns = this.props.columns.map((column) => (
      <RestoreBarItem
        key={column.id}
        objectType="column"
        data={column}
        renderer={this.props.renderer}
      />
    ))
    let weeks = this.props.weeks.map((week) => (
      <RestoreBarItem
        key={week.id}
        objectType="week"
        data={week}
        renderer={this.props.renderer}
      />
    ))
    let nodes = this.props.nodes.map((node) => (
      <RestoreBarItem
        key={node.id}
        objectType="node"
        data={node}
        renderer={this.props.renderer}
      />
    ))
    let outcomes = this.props.outcomes.map((outcome) => (
      <RestoreBarItem
        key={outcome.id}
        objectType="outcome"
        data={outcome}
        renderer={this.props.renderer}
      />
    ))
    let nodelinks = this.props.nodelinks.map((nodelink) => (
      <RestoreBarItem
        key={nodelink.id}
        objectType="nodelink"
        data={nodelink}
        renderer={this.props.renderer}
      />
    ))

    return (
      <div id="restore-bar-workflow" className="right-panel-inner">
        <h3>{gettext('Restore items')}</h3>
        <hr />
        <h4>{gettext('Nodes')}</h4>
        <div className="node-bar-column-block">{nodes}</div>
        <hr />
        <h4>{gettext('Weeks')}</h4>
        <div className="node-bar-column-block">{weeks}</div>
        <hr />
        <h4>{gettext('Columns')}</h4>
        <div className="node-bar-column-block">{columns}</div>
        <hr />
        <h4>{gettext('Outcomes')}</h4>
        <div className="node-bar-column-block">{outcomes}</div>
        <hr />
        <h4>{gettext('Node Links')}</h4>
        <div className="node-bar-column-block">{nodelinks}</div>
      </div>
    )
  }

  componentDidMount() {
    this.checkVisible()
  }
  componentDidUpdate() {
    this.checkVisible()
  }

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
}
const mapRestoreBarStateToProps = (state) => ({
  weeks: state.week.filter((x) => x.deleted),
  columns: state.column.filter((x) => x.deleted),
  nodes: state.node.filter((x) => x.deleted),
  outcomes: state.outcome.filter((x) => x.deleted),
  nodelinks: state.nodelink.filter((x) => x.deleted)
})
export default connect(mapRestoreBarStateToProps, null)(RestoreBarUnconnected)

class RestoreBarItem extends Component {
  render() {
    return (
      <div ref={this.maindiv} className="restore-bar-item">
        <div>{this.getTitle()}</div>
        <div className="workflow-created">
          {gettext('Deleted') + ' ' + this.props.data.deleted_on}
        </div>
        <button onClick={this.restore.bind(this)}>{gettext('Restore')}</button>
        <button onClick={this.delete.bind(this)}>
          {gettext('Permanently Delete')}
        </button>
      </div>
    )
  }

  getTitle() {
    if (this.props.data.title && this.props.data.title !== '')
      return this.props.data.title
    if (
      this.props.objectType == 'node' &&
      this.props.data.represents_workflow &&
      this.props.linked_workflow_data &&
      this.props.data.linked_workflow_data.title &&
      this.props.data.linked_workflow_data.title !== ''
    )
      return this.props.data.linked_workflow_data.title
    return gettext('Untitled')
  }

  restore() {
    this.setState({ disabled: true })
    this.props.renderer.tiny_loader.startLoad()
    restoreSelf(this.props.data.id, this.props.objectType, () => {
      this.props.renderer.tiny_loader.endLoad()
    })
  }

  delete() {
    if (
      window.confirm(
        gettext('Are you sure you want to permanently delete this object?')
      )
    ) {
      $(this.maindiv.current).children('button').attr('disabled', true)
      this.props.renderer.tiny_loader.startLoad()
      deleteSelf(this.props.data.id, this.props.objectType, false, () => {
        this.props.renderer.tiny_loader.endLoad()
      })
    }
  }
}
