import * as React from 'react'
import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'
import { Workflow } from '@cfModule/types/common'
import { getHomeQuery } from '@XMLHTTP/API/pages'

/*******************************************************
 * @HomeRenderer
 *******************************************************/
type PropsType = {
  is_teacher: string
}
type StateType = {
  projects: Workflow[]
  favourites: Workflow[]
}

class HomePage extends React.Component<PropsType, StateType> {
  private readonly isTeacher

  constructor(props: PropsType) {
    super(props)
    this.state = {
      projects: [],
      favourites: []
    }
    this.isTeacher = props.is_teacher // @todo reassign props
  }

  /*******************************************************
   * Lifecycle hooks
   *******************************************************/
  componentDidMount() {
    getHomeQuery((data) => {
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
      <WorkflowCard key={`${keyPrefix}-${index}`} workflowData={workflow} />
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

    const projectTitle = this.isTeacher
      ? 'Recent projects'
      : 'Recent classrooms'
    const projectPath = this.isTeacher
      ? COURSEFLOW_APP.config.my_library_path
      : COURSEFLOW_APP.config.my_liveprojects_path
    const favouritePath = COURSEFLOW_APP.config.my_favourites_path

    const projectBox = this.renderHomeItem(
      projectTitle,
      projectsContent,
      projectPath
    )

    let favouriteBox
    if (this.isTeacher) {
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
