import WorkflowCard from '@cfCommonComponents/cards/WorkflowCard'
import Alert from '@cfCommonComponents/UIComponents/Alert'
import { GridWrap, OuterContentWrap } from '@cfModule/mui/helper'
import Welcome from './components/Welcome'
import Section from './components/Section'
import { fetchHomeContext } from '@XMLHTTP/API/pages'
import { PageHomeQueryResp } from '@XMLHTTP/types/query'
import { useQuery } from '@tanstack/react-query'
import Loader from '@cfCommonComponents/UIComponents/Loader'

/**
 *
 * @constructor
 */
const Home = () => {
  const { data, error, isLoading, isError } = useQuery<PageHomeQueryResp>({
    queryKey: ['fetchHomeContext'],
    queryFn: fetchHomeContext
  })

  if (isLoading) return <Loader />
  if (isError) return <div>An error occurred: {error.message}</div>

  const { projects, isTeacher, templates } = data.data

  return (
    <OuterContentWrap>
      <Welcome hide={!!data.data.projects.length} />
      {!!projects.length && (
        <Section
          header={
            isTeacher
              ? {
                  title: window.gettext('Recent projects'),
                  seeAll: {
                    text: 'View all projects',
                    href: COURSEFLOW_APP.globalContextData.path.my_library_path
                  }
                }
              : {
                  title: window.gettext('Recent classrooms'),
                  seeAll: {
                    text: 'View all classrooms',
                    href: COURSEFLOW_APP.globalContextData.path
                      .my_liveprojects_path
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
        <Alert sx={{ mb: 3 }} severity="warning" title="TODO - Backend" />
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
