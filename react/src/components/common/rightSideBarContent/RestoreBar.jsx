import * as React from 'react'
import { connect } from 'react-redux'
import { restoreSelfQuery, deleteSelfQuery } from '@XMLHTTP/PostFunctions'
import ComponentWithToggleDrop from '@cfParentComponents/ComponentWithToggleDrop.tsx'
import $ from 'jquery'

/**
 * The delete/restore tab of the right sidebar in the workflow view.
 */

class RestoreBarUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'workflow'
  }

  render() {
    const columns = this.props.columns.map((column) => (
      <RestoreBarItem
        key={column.id}
        objectType="column"
        data={column}
        renderer={this.props.renderer}
      />
    ))
    const weeks = this.props.weeks.map((week) => (
      <RestoreBarItem
        key={week.id}
        objectType="week"
        data={week}
        renderer={this.props.renderer}
      />
    ))
    const nodes = this.props.nodes.map((node) => (
      <RestoreBarItem
        key={node.id}
        objectType="node"
        data={node}
        renderer={this.props.renderer}
      />
    ))
    const outcomes = this.props.outcomes.map((outcome) => (
      <RestoreBarItem
        key={outcome.id}
        objectType="outcome"
        data={outcome}
        renderer={this.props.renderer}
      />
    ))
    const nodelinks = this.props.nodelinks.map((nodelink) => (
      <RestoreBarItem
        key={nodelink.id}
        objectType="nodelink"
        data={nodelink}
        renderer={this.props.renderer}
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

class RestoreBarItem extends ComponentWithToggleDrop {
  render() {
    return (
      <div ref={this.mainDiv} className="restore-bar-item">
        <div>{this.getTitle()}</div>
        <div className="workflow-created">
          {window.gettext('Deleted') + ' ' + this.props.data.deleted_on}
        </div>
        <button onClick={this.restore.bind(this)}>{window.gettext('Restore')}</button>
        <button onClick={this.delete.bind(this)}>
          {window.gettext('Permanently Delete')}
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
    COURSEFLOW_APP.tinyLoader.startLoad()
    restoreSelfQuery(this.props.data.id, this.props.objectType, () => {
      COURSEFLOW_APP.tinyLoader.endLoad()
    })
  }

  delete() {
    if (
      window.confirm(
        gettext('Are you sure you want to permanently delete this object?')
      )
    ) {
      $(this.mainDiv.current).children('button').attr('disabled', true)
      COURSEFLOW_APP.tinyLoader.startLoad()
      deleteSelfQuery(this.props.data.id, this.props.objectType, false, () => {
        COURSEFLOW_APP.tinyLoader.endLoad()
      })
    }
  }
}
