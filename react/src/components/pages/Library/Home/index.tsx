import React, { useEffect, useState } from 'react'
import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'
import Welcome from './components/Welcome'
import Section from './components/Section'
import { Workflow } from '@cfModule/types/common'
import { getHomeQuery } from '@XMLHTTP/API/pages'
import { OuterContentWrap } from '@cfModule/mui/helper'

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

  function workflowCards(workflows: Workflow[], keyPrefix: string) {
    return workflows.map((workflow, index) => (
      <WorkflowCard key={`${keyPrefix}-${index}`} workflowData={workflow} />
    ))
  }

  if (state.loading) {
    return null
  }

  const { projects, favourites } = state

  return (
    <OuterContentWrap>
      <Welcome hide={!!state.projects.length} />
      {state.projects.length && (
        <Section
          header={
            is_teacher
              ? {
                  title: window.gettext('Recent projects'),
                  seeAll: {
                    text: 'View all projects',
                    href: COURSEFLOW_APP.config.my_library_path
                  }
                }
              : {
                  title: window.gettext('Recent classrooms'),
                  seeAll: {
                    text: 'View all classrooms',
                    href: COURSEFLOW_APP.config.my_liveprojects_path
                  }
                }
          }
          content={workflowCards(projects, 'project')}
        />
      )}

      {is_teacher && (
        <Section
          header={{
            title: 'Favourites',
            seeAll: {
              text: 'See all favourites',
              href: COURSEFLOW_APP.config.my_favourites_path
            }
          }}
          content={workflowCards(favourites, 'favourite')}
        />
      )}
    </OuterContentWrap>
  )
}

export default Home
