import React from 'react'
import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'
import Welcome from './components/Welcome'
import Section from './components/Section'
import Alert from '@cfCommonComponents/components/Alert'
import { Workflow } from '@cfModule/types/common'
import { GridWrap, OuterContentWrap } from '@cfModule/mui/helper'

type PropsType = {
  projects: Workflow[]
  templates: Workflow[]
  isTeacher: boolean
}

const Home = ({ isTeacher, projects, templates }: PropsType) => {
  return (
    <OuterContentWrap>
      <Welcome hide={!!projects.length} />
      {!!projects.length && (
        <Section
          header={
            isTeacher
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
          <GridWrap>
            {projects.map((project, index) => (
              <WorkflowCard key={`project-${index}`} workflowData={project} />
            ))}
          </GridWrap>
        </Section>
      )}

      <Section
        header={{
          title: projects.length
            ? window.gettext('Explore templates')
            : window.gettext('Get started with templates')
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
        <GridWrap>
          {templates.map((template, index) => (
            <WorkflowCard key={`template-${index}`} workflowData={template} />
          ))}
        </GridWrap>
      </Section>
    </OuterContentWrap>
  )
}

export default Home
