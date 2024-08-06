import * as React from 'react'
import { connect } from 'react-redux'
import MenuTab from '@cfCommonComponents/menu/components/MenuTab'
import { AppState } from '@cfRedux/types/type'

type ConnectedProps = {
  data_package: AppState
}
type OwnProps = {
  dispatch?: any // @todo
}
type PropsType = ConnectedProps & OwnProps

/**
 * Mostly no longer used, only currently used by the "My Classrooms" view which is not a priority to revamp.
 */
class WorkflowGridMenuUnconnected extends React.Component<PropsType> {
  render() {
    const tabs = []
    const tab_li = []
    let i = 0
    for (const prop in this.props.data_package) {
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

const mapStateToProps = (state: AppState) => ({ data_package: state })

const WorkflowGridMenu = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(WorkflowGridMenuUnconnected)

export default WorkflowGridMenu
