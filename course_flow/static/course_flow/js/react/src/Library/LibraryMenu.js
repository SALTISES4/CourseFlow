import * as React from 'react'
import * as reactDom from 'react-dom'
import { getLibrary } from '../PostFunctions.js'
import WorkflowFilter from './WorkFlowFilter.js'

/*
The main library menu

On mount, this will fetch the user's projects. When they have been
retrieved it will display them in a workflowfilter.
*/
class LibraryMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.createDiv = React.createRef()
  }

  render() {
    return (
      <div className="project-menu">
        {reactDom.createPortal(
          this.getCreate(),
          document.getElementById('visible-icons')
        )}
        {reactDom.createPortal(
          this.getOverflowLinks(),
          document.getElementById('overflow-links')
        )}
        <WorkflowFilter
          renderer={this.props.renderer}
          workflows={this.state.project_data}
          context="library"
        />
      </div>
    )
  }

  getCreate() {
    let create
    if (!this.props.renderer.read_only)
      create = (
        <div
          className="hover-shade"
          id="create-project-button"
          title={gettext('Create project or strategy')}
          ref={this.createDiv}
        >
          <span className="material-symbols-rounded filled green">
            add_circle
          </span>
          <div id="create-links-project" className="create-dropdown">
            <a
              id="project-create-library"
              href={config.create_path.project}
              className="hover-shade"
            >
              {gettext('New project')}
            </a>
            <hr />
            <a
              id="activity-strategy-create"
              href={config.create_path.activity_strategy}
              className="hover-shade"
            >
              {gettext('New activity strategy')}
            </a>
            <a
              id="course-strategy-create"
              href={config.create_path.course_strategy}
              className="hover-shade"
            >
              {gettext('New course strategy')}
            </a>
          </div>
        </div>
      )
    return create
  }

  getOverflowLinks() {
    let overflow_links = []
    overflow_links.push(
      <a id="import-old" className="hover-shade" href={config.get_paths.import}>
        {gettext('Import from old CourseFlow')}
      </a>
    )
    return overflow_links
  }

  componentDidMount() {
    let component = this
    getLibrary((data) => {
      component.setState({ project_data: data.data_package })
    })
    makeDropdown(this.createDiv.current)
  }
}

export default LibraryMenu
