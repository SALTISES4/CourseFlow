import React, { useEffect, useState, ReactNode } from 'react'
import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'
import { Workflow } from '@cfModule/types/common'
import { getHomeQuery } from '@XMLHTTP/API/pages'
import { OuterContentWrap } from '@cfModule/mui/helper'
import Welcome from './components/Welcome'

type PropsType = {
  is_teacher: boolean
}

type StateType = {
  loading: boolean
  projects: Workflow[]
  favourites: Workflow[]
}

const Home = ({ is_teacher }: PropsType) => {
  const [state, setState] = useState<StateType>({
    loading: true,
    projects: [],
    favourites: []
  })

  useEffect(() => {
    getHomeQuery((data) => {
      setState({ ...data, loading: false })
    })
  }, [])

  function renderWorkflowCards(workflows: Workflow[], keyPrefix: string) {
    return workflows.map((workflow, index) => (
      <WorkflowCard key={`${keyPrefix}-${index}`} workflowData={workflow} />
    ))
  }

  function renderHomeItem(title: string, content: ReactNode, path: string) {
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

  if (state.loading) {
    return null
  }

  const { projects, favourites } = state
  const projectsContent = renderWorkflowCards(projects, 'project')
  const favouritesContent = renderWorkflowCards(favourites, 'favourite')

  const projectTitle = is_teacher
    ? window.gettext('Recent projects')
    : window.gettext('Recent classrooms')

  const projectPath = is_teacher
    ? COURSEFLOW_APP.config.my_library_path
    : COURSEFLOW_APP.config.my_liveprojects_path

  const favouritePath = COURSEFLOW_APP.config.my_favourites_path

  const projectsSection = renderHomeItem(
    projectTitle,
    projectsContent,
    projectPath
  )

  let favouritesSection: ReactNode = null
  if (is_teacher) {
    favouritesSection = renderHomeItem(
      'Favourites',
      favouritesContent,
      favouritePath
    )
  }

  return (
    <OuterContentWrap>
      <Welcome hide={!!state.projects.length} />
      {projectsSection}
      {favouritesSection}
    </OuterContentWrap>
  )
}

export default Home
