import * as React from 'react'
import HomeMenu from '@cfPages/Library/Home/components/HomeMenu'
import { getHome } from '@XMLHTTP/PostFunctions'
import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'

/*******************************************************
 * @HomeRenderer
 *******************************************************/
type PropsType = {
  is_teacher: string
}

class HomePage extends React.Component {
  private is_teacher

  constructor(props: PropsType) {
    super(props)
    this.is_teacher = props.is_teacher
    this.state = { projects: [], favourites: [] }
  }

  /*******************************************************
   * Lifecycle hooks
   *******************************************************/
  componentDidMount() {
    getHome((data) => {
      this.setState({
        projects: data.projects,
        favourites: data.favourites
      })
    })
  }

  /*******************************************************
   * Render
   *******************************************************/
  renderWorkflowCards(workflows, keyPrefix) {
    return workflows.map((workflow, index) => (
      <WorkflowCard
        key={`${keyPrefix}-${index}`}
        workflowData={workflow}
        projectData={this.props.renderer.project_data}
        readOnly={this.props.renderer.read_only}
        userRole={this.props.renderer.user_role}
      />
    ))
  }

  renderHomeItem(title, content, path) {
    return (
      <div className="home-item">
        <div className="home-title-row">
          <div className="home-item-title">{window.gettext(title)}</div>
          <a className="collapsed-text-show-more" href={path}>
            {window.gettext('See all')}
          </a>
        </div>
        <div className="menu-grid">{content}</div>
      </div>
    )
  }

  render() {
    const { projects, favourites } = this.state
    const projectsContent = this.renderWorkflowCards(projects, 'project')
    const favouritesContent = this.renderWorkflowCards(favourites, 'favourite')

    const projectTitle = this.is_teacher
      ? 'Recent projects'
      : 'Recent classrooms'
    const projectPath = this.is_teacher
      ? COURSEFLOW_APP.config.my_library_path
      : COURSEFLOW_APP.config.my_liveprojects_path
    const favouritePath = COURSEFLOW_APP.config.my_favourites_path

    const projectBox = this.renderHomeItem(
      projectTitle,
      projectsContent,
      projectPath
    )
    let favouriteBox
    if (this.is_teacher) {
      favouriteBox = this.renderHomeItem(
        'Favourites',
        favouritesContent,
        favouritePath
      )
    }

    return (
      <div className="home-menu-container">
        {projectBox}
        {favouriteBox}
      </div>
    )
  }
}

export default HomePage
