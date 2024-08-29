import WorkflowCardDumb, {
  PropsType as WorkflowCardDumbPropsType
} from '@cfPages/Styleguide/components/WorkflowCard'
import Alert from '@cfPages/Styleguide/components/Alert'
import { GridWrap, OuterContentWrap } from '@cf/mui/helper'
import Welcome from './components/Welcome'
import Section from './components/Section'

type PropsType = {
  projects: WorkflowCardDumbPropsType[]
  templates: WorkflowCardDumbPropsType[]
  isTeacher: boolean
}

import data from './data'

const Homepage = () => {
  const { isTeacher, projects, templates }: PropsType = data

  return (
    <OuterContentWrap>
      <Welcome hide={!!projects.length} />
      {!!projects.length && (
        <Section
          header={
            isTeacher
              ? {
                  title: 'Recent projects',
                  seeAll: {
                    text: 'View all projects',
                    href: '#'
                  }
                }
              : {
                  title: 'Recent classrooms',
                  seeAll: {
                    text: 'View all classrooms',
                    href: '#'
                  }
                }
          }
        >
          <GridWrap>
            {projects.map((project, index) => (
              <WorkflowCardDumb key={index} {...project} chips={[]} />
            ))}
          </GridWrap>
        </Section>
      )}

      <Section
        header={{
          title: projects.length
            ? 'Explore templates'
            : 'Get started with templates'
        }}
      >
        <Alert
          sx={{ mb: 3 }}
          severity="info"
          title={'How to use templates'}
          subtitle={
            'Templates provide a pre-established structure anchored in pedagogical best practices so that you don’t need to start from scratch!'
          }
          hideIfCookie="home-howto-template"
        />
        <Alert sx={{ mb: 3 }} severity="warning" title="TODO - Backend" />
        <GridWrap>
          {templates.map((template, index) => (
            <WorkflowCardDumb key={index} {...template} />
          ))}
        </GridWrap>
      </Section>
    </OuterContentWrap>
  )
}

export default Homepage
