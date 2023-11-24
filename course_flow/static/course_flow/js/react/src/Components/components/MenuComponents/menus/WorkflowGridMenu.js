import * as React from 'react'
import { connect } from 'react-redux'
import MenuTab from '../components/MenuTab.js'

/**
 * Mostly no longer used, only currently used by the "My Classrooms" view which is not a priority to revamp.
 */
class WorkflowGridMenuUnconnected extends React.Component {
  render() {
    var tabs = []
    var tab_li = []
    var i = 0
    for (var prop in this.props.data_package) {
      tab_li.push(
        <li>
          <a className="hover-shade" href={'#tabs-' + i}>
            {this.props.data_package[prop].title}
          </a>
        </li>
      )
      tabs.push(
        <MenuTab
          data={this.props.data_package[prop]}
          dispatch={this.props.dispatch}
          type="gridmenu"
          identifier={i}
        />
      )
      i++
    }
    return (
      <div className="project-menu">
        <div className="home-tabs" id="home-tabs">
          <ul>{tab_li}</ul>
          {tabs}
        </div>
      </div>
    )
  }
}
const WorkflowGridMenu = connect(
  (state) => ({ data_package: state }),
  null
)(WorkflowGridMenuUnconnected)

export default WorkflowGridMenu
