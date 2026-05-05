import { useLibrarySearch } from '@cf/api/wrappedHooks'
import { CookieTypes } from '@cf/context/cookieContext'
import { CFRoutes } from '@cf/router/appRoutes'
import { formatLibraryObjects } from '@cf/utility/marshalling/libraryCards'
import { _t } from '@cf/utility/Utility.class'
import WorkflowCardWrapper from '@cfComponents/cards/WorkflowCardWrapper'
import Alert from '@cfComponents/UIPrimitives/Alert'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { GridWrap, OuterContentWrap } from '@cfMUI/helper'

import Section from './components/Section'
import Welcome from './components/Welcome'

const Home = () => {
  const { data, isLoading } = useLibrarySearch({
    pagination: {
      page: 0,
      resultsPerPage: 10
    }
  })

  if (isLoading) {
    return <Loader />
  }

  //  const { projects, templates } = data.dataPackage
  const projects = data.items

  const formattedProjects = formatLibraryObjects(projects)

  // const formattedTemplates = formatLibraryObjects(templates)
  const formattedTemplates = []

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
            {formattedProjects.map((item) => (
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
        sx={{ marginTop: projects.length ? 0 : 4 }}
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
          {formattedTemplates.map((item) => (
            <WorkflowCardWrapper key={`template-${item.id}`} {...item} />
          ))}
        </GridWrap>
      </Section>
    </OuterContentWrap>
  )
}

export default Home
