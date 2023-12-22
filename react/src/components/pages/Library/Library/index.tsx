// @ts-nocheck
import * as React from 'react'
import { getLibraryQuery } from '@XMLHTTP/PostFunctions.js'
import { LibraryQueryResp } from '@XMLHTTP/types.js'
import { MenuBar } from '@cfCommonComponents/components/index.jsx'
import WorkflowFilter from '@cfCommonComponents/workflow/filters/WorkflowFilter/index.jsx'

/*******************************************************
 * @LibraryRenderer
 *******************************************************/
class LibraryPage extends React.Component {
  private createDiv: React.RefObject<HTMLDivElement>
  private read_only: any

  constructor(props) {
    super(props)

    this.read_only = this.props.renderer.read_only
    this.createDiv = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE HOOKS
   *******************************************************/
  componentDidMount() {
    getLibraryQuery((data: LibraryQueryResp) => {
      this.setState({
        project_data: data.data_package
      })
    })
    COURSEFLOW_APP.makeDropdown(this.createDiv.current)
  }

  /***
   * z
   */
  CreateButton = () => {
    /**
     * NOTE: this create button previously had a condition where
     * would only render it props.readonly was not dfined, but read only not set for libary path ever
     *  (??) verify
     */
    return (
      <div
        className="hover-shade"
        id="create-project-button"
        title={window.gettext('Create project or strategy')}
        ref={this.createDiv}
      >
        <span className="material-symbols-rounded filled green">
          add_circle
        </span>
        <div id="create-links-project" className="create-dropdown">
          <a
            id="project-create-library"
            href={COURSEFLOW_APP.config.create_path.project}
            className="hover-shade"
          >
            {window.gettext('New project')}
          </a>
          <hr />
          <a
            id="activity-strategy-create"
            href={COURSEFLOW_APP.config.create_path.activity_strategy}
            className="hover-shade"
          >
            {window.gettext('New activity strategy')}
          </a>
          <a
            id="course-strategy-create"
            href={COURSEFLOW_APP.config.create_path.course_strategy}
            className="hover-shade"
          >
            {window.gettext('New course strategy')}
          </a>
        </div>
      </div>
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    return (
      <div className="main-block">
        <MenuBar
          overflow_links={<OverflowLinks />}
          visible_buttons={<this.CreateButton />}
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

export default LibraryPage
