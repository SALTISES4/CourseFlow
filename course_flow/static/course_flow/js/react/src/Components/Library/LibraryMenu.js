import * as React from 'react'
import * as reactDom from 'react-dom'
import { getLibrary } from '@cfPostFunctions'
import WorkflowFilter from './WorkFlowFilter.js'
import { MenuBar } from '@cfCommonComponents'

/*******************************************************
 * The main library menu
 *
 * On mount, this will fetch the user's projects. When they have been
 * retrieved it will display them in a workflowfilter.
 *******************************************************/
class LibraryMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.createDiv = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE HOOKS
   *******************************************************/
  componentDidMount() {
    getLibrary((data) => {
      this.setState({ project_data: data.data_package })
    })
    makeDropdown(this.createDiv.current)
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
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

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let visible_buttons = this.getCreate.bind(this)
    let overflow_links = this.getOverflowLinks.bind(this)

    return (
      <div class="main-block">
        <MenuBar
          overflow_links={overflow_links}
          visible_buttons={visible_buttons}
        />
        <div className="project-menu">
          <WorkflowFilter
            renderer={this.props.renderer}
            workflows={this.state.project_data}
            context="library"
          />
        </div>
      </div>
    )
  }
}

export default LibraryMenu
