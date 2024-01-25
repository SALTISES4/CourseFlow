import * as React from 'react'
import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'
import { Workflow } from '@cfModule/types/common'
import { getHomeQuery } from '@XMLHTTP/API/menu'

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
  private isTeacher: string

  constructor(props: PropsType) {
    super(props)
    this.state = {
      projects: [],
      favourites: []
    }
    this.isTeacher = props.is_teacher // @todo reassign props once naming convention is workded out
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
   * COMPONENTS
   *******************************************************/

  WorkflowCards = ({
    workflows,
    keyPrefix
  }: {
    workflows: Workflow[]
    keyPrefix: string
  }) => {
    return workflows.map((workflow, index) => (
      <WorkflowCard key={`${keyPrefix}-${index}`} workflowData={workflow} />
    ))
  }

  Home = ({
    title,
    content,
    path
  }: {
    title: string
    content: React.ReactNode
    path: string
  }) => {
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

  /*******************************************************
   * Render
   *******************************************************/

  render() {
    const { projects, favourites } = this.state
    const projectsContent = (
      <this.WorkflowCards workflows={projects} keyPrefix={'project'} />
    )
    const favouritesContent = (
      <this.WorkflowCards workflows={favourites} keyPrefix={'favourite'} />
    )

    const projectTitle = this.isTeacher
      ? 'Recent projects'
      : 'Recent classrooms'

    const projectPath = this.isTeacher
      ? COURSEFLOW_APP.config.my_library_path
      : COURSEFLOW_APP.config.my_liveprojects_path
    const favouritePath = COURSEFLOW_APP.config.my_favourites_path

    const projectBox = (
      <this.Home
        title={projectTitle}
        content={projectsContent}
        path={projectPath}
      />
    )

    const favouriteBox = this.isTeacher ? (
      <this.Home
        title={'Favourites'}
        content={favouritesContent}
        path={favouritePath}
      />
    ) : (
      <></>
    )

    return (
      <div className="home-menu-container">
        {projectBox}
        {favouriteBox}
      </div>
    )
  }
}

export default HomePage
