import * as React from 'react'
import WorkflowFilter from '@cfCommonComponents/filters/WorkflowFilter/index.jsx'
import MenuBar from '@cfCommonComponents/components/MenuBar'
import { Workflow } from '@cfModule/types/common'
import { LibraryQueryResp } from '@cfModule/XMLHTTP/types/query'
import { getLibraryQuery } from '@XMLHTTP/API/pages'

type PropsType = Record<string, never>
type StateType = {
  project_data?: Workflow[]
}
/*******************************************************
 * @LibraryRenderer
 *******************************************************/
class LibraryPage extends React.Component<PropsType, StateType> {
  private createDiv: React.RefObject<HTMLDivElement>

  constructor(props: PropsType) {
    super(props)
    this.state = {}
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
   *
   */
  CreateButton = () => {
    /**
     * NOTE: this creates button previously had a condition where
     * would only render it props.readonly was not defined, but read only not set for library path ever
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
          {/*
           // this has text add_circle in it before
           add_circle
           */}
        </span>
        <div id="create-links-project" className="create-dropdown">
          <a
            id="project-create-library"
            href={COURSEFLOW_APP.globalContextData.path.create_path.project}
            className="hover-shade"
          >
            {window.gettext('New project')}
          </a>
          <hr />
          <a
            id="activity-strategy-create"
            href={COURSEFLOW_APP.globalContextData.path.create_path.activity_strategy}
            className="hover-shade"
          >
            {window.gettext('New activity strategy')}
          </a>
          <a
            id="course-strategy-create"
            href={COURSEFLOW_APP.globalContextData.path.create_path.course_strategy}
            className="hover-shade"
          >
            {window.gettext('New course strategy')}
          </a>
        </div>
      </div>
    )
  }

  OverflowLinks = () => {
    return (
      <a
        id="import-old"
        className="hover-shade"
        href={COURSEFLOW_APP.globalContextData.path.get_paths.import}
      >
        {window.gettext('Import from old CourseFlow')}
      </a>
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    return (
      <div className="main-block">
        <MenuBar
          overflowLinks={() => <this.OverflowLinks />}
          visibleButtons={() => <this.CreateButton />}
        />
        <div className="project-menu">
          <WorkflowFilter
            // renderer={this} @todo rendere is no longer used, but check this to make sure we're getting the data we need into this component
            workflows={this.state.project_data}
            context="library"
          />
        </div>
      </div>
    )
  }
}

export default LibraryPage
