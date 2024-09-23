import { CookieTypes } from '@cf/context/cookieContext'
import { GridWrap, OuterContentWrap } from '@cf/mui/helper'
import { CFRoutes } from '@cf/router/appRoutes'
import { formatLibraryObjects } from '@cf/utility/marshalling/libraryCards'
import { _t } from '@cf/utility/utilityFunctions'
import WorkflowCardWrapper from '@cfComponents/cards/WorkflowCardWrapper'
import Alert from '@cfComponents/UIPrimitives/Alert'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { useGetHomeContextQuery } from '@XMLHTTP/API/library.rtk'

import Section from './components/Section'
import Welcome from './components/Welcome'

const Home = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { data, error, isLoading } = useGetHomeContextQuery()

  if (isLoading) return <Loader />

  const { projects, templates } = data.dataPackage

  const formattedProjects = formatLibraryObjects(projects)
  const formattedTemplates = formatLibraryObjects(templates)

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <OuterContentWrap>
      <Welcome hide={!projects.length} />
      {!!projects.length && (
        <Section
          header={{
            title: _t('Recent projects'),
            seeAll: {
              text: _t('View all projects'),
              href: CFRoutes.LIBRARY
            }
          }}
        >
          <GridWrap>
            {formattedProjects.map((item, index) => (
              <WorkflowCardWrapper key={`project-${item.id}`} {...item} />
            ))}
          </GridWrap>
        </Section>
      )}

      <Section
        header={{
          title: projects.length
            ? _t('Explore templates')
            : _t('Get started with templates')
        }}
      >
        <Alert
          sx={{ mb: 3 }}
          severity="info"
          title={_t('How to use templates')}
          subtitle={_t(
            'Templates provide a pre-established structure anchored in pedagogical best practices so that you don’t need to start from scratch!'
          )}
          hideIfCookie={CookieTypes.HIDE_HOME_HOWTO_TEMPLATE_MESSAGE}
        />

        <Alert sx={{ mb: 3 }} severity="warning" title="TODO - Backend" />
        <GridWrap>
          {formattedTemplates.map((item, index) => (
            <WorkflowCardWrapper key={`template-${item.id}`} {...item} />
          ))}
        </GridWrap>
      </Section>
    </OuterContentWrap>
  )
}

export default Home
