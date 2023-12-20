import * as React from 'react'
import { getHome } from '@XMLHTTP/PostFunctions'
import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'

class HomeMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = { projects: [], favourites: [] }
  }

  /*******************************************************
   * Lifecycle hooks
   *******************************************************/
  componentDidMount() {
    let component = this
    getHome((data) => {
      component.setState({
        projects: data.projects,
        favourites: data.favourites
      })
    })
  }

  /*******************************************************
   * Render
   *******************************************************/
  render() {
    let projects = this.state.projects.map((project, index) => (
      <WorkflowCard
        key={`project-${index}`}
        workflow_data={project}
        renderer={this.props.renderer}
      />
    ))
    let favourites = this.state.favourites.map((project, index) => (
      <WorkflowCard
        key={`favourite-${index}`}
        workflow_data={project}
        renderer={this.props.renderer}
      />
    ))
    let library_path = COURSEFLOW_APP.config.my_library_path
    if (!this.props.renderer.is_teacher)
      library_path = COURSEFLOW_APP.config.my_liveprojects_path

    let project_box
    if (this.props.renderer.is_teacher) {
      project_box = (
        <div className="home-item">
          <div className="home-title-row">
            <div className="home-item-title">
              {window.gettext('Recent projects')}
            </div>
            <a className="collapsed-text-show-more" href={library_path}>
              {window.gettext('See all')}
            </a>
          </div>
          <div className="menu-grid">{projects}</div>
        </div>
      )
    } else {
      project_box = (
        <div className="home-item">
          <div className="home-title-row">
            <div className="home-item-title">
              {window.gettext('Recent classrooms')}
            </div>
            <a className="collapsed-text-show-more" href={library_path}>
              {window.gettext('See all')}
            </a>
          </div>
          <div className="menu-grid">{projects}</div>
        </div>
      )
    }

    let favourite_box
    if (this.props.renderer.is_teacher) {
      favourite_box = (
        <div className="home-item">
          <div className="home-title-row">
            <div className="home-item-title">
              {window.gettext('Favourites')}
            </div>
            <a
              className="collapsed-text-show-more"
              href={COURSEFLOW_APP.config.my_favourites_path}
            >
              {window.gettext('See all')}
            </a>
          </div>
          <div className="menu-grid">{favourites}</div>
        </div>
      )
    }

    return (
      <div className="home-menu-container">
        {project_box}
        {favourite_box}
      </div>
    )
  }
}

export default HomeMenu
