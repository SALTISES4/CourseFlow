import React, { useEffect, useState } from 'react'
import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'
import Welcome from './components/Welcome'
import Section from './components/Section'
import Alert from '@cfCommonComponents/components/Alert'
import { Workflow } from '@cfModule/types/common'
import { getHomeQuery } from '@XMLHTTP/API/pages'
import { GridWrap, OuterContentWrap } from '@cfModule/mui/helper'

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
        >
          <GridWrap>{workflowCards(projects, 'project')}</GridWrap>
        </Section>
      )}

      <Section
        header={{
          title: 'Explore templates'
        }}
      >
        <Alert
          sx={{ mb: 3 }}
          severity="info"
          title={window.gettext('How to use templates')}
          subtitle={window.gettext(
            'Templates provide a pre-established structure anchored in pedagogical best practices so that you don’t need to start from scratch!'
          )}
          hideIfCookie="home-howto-template"
        />
        <GridWrap>{workflowCards(favourites, 'templates')}</GridWrap>
      </Section>
    </OuterContentWrap>
  )
}

export default Home
