import {
  LibraryContentTypeIn,
  LibrarySortDirectionIn,
  LibrarySortValueIn
} from '@cf/api/gen'
import { useLibrarySearch } from '@cf/api/wrappedHooks'
import { CookieTypes } from '@cf/context/cookieContext'
import { UserContext } from '@cf/context/userContext'
import { CFRoutes } from '@cf/router/appRoutes'
import { formatLibraryObjects } from '@cf/utility/marshalling/libraryCards'
import WorkflowCardWrapper from '@cfComponents/cards/WorkflowCardWrapper'
import Alert from '@cfComponents/UIPrimitives/Alert'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { GridWrap, OuterContentWrap } from '@cfMUI/helper'
import { exploreTemplateFilters } from '@cfPages/Library/Explore'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'

import Section from './components/Section'
import Welcome from './components/Welcome'

const Home = () => {
  const user = useContext(UserContext)
  const { t } = useTranslation('home')
  const { t: tLibrary } = useTranslation('library')
  const { data: projectsData, isLoading: projectsLoading } = useLibrarySearch({
    pagination: {
      page: 0,
      resultsPerPage: 4
    },
    sort: {
      value: LibrarySortValueIn.DATE_MODIFIED,
      direction: LibrarySortDirectionIn.DESC
    },
    filters: {
      contentType: LibraryContentTypeIn.PROJECT,
      isArchived: false
    }
  })

  const { data: templatesData, isLoading: templatesLoading } = useLibrarySearch(
    {
      pagination: {
        page: 0,
        resultsPerPage: 4
      },
      sort: {
        value: LibrarySortValueIn.DATE_MODIFIED,
        direction: LibrarySortDirectionIn.DESC
      },
      filters: {
        contentType: LibraryContentTypeIn.WORKFLOW,
        isTemplate: true,
        isArchived: false
      }
    }
  )

  if (projectsLoading || templatesLoading || !projectsData || !templatesData) {
    return <Loader />
  }

  const projects = projectsData.items ?? []
  const templates = templatesData.items ?? []

  const formattedProjects = formatLibraryObjects(projects, tLibrary)
  const formattedTemplates = formatLibraryObjects(templates, tLibrary)
  const ownsAnyProject = user.meta?.ownsAnyProject

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <OuterContentWrap>
      <Welcome hide={ownsAnyProject} />
      {!!projects.length && (
        <Section
          header={{
            title: t('sections.recentProjects'),
            seeAll: {
              text: t('sections.viewAllProjects'),
              href: CFRoutes.LIBRARY
            }
          }}
        >
          <GridWrap>
            {formattedProjects.map((item) => (
              <WorkflowCardWrapper key={`project-${item.uuid}`} {...item} />
            ))}
          </GridWrap>
        </Section>
      )}

      <Section
        header={{
          title: projects.length
            ? t('sections.exploreTemplates')
            : t('sections.getStartedTemplates'),
          seeAll: {
            text: t('sections.viewAllTemplates'),
            href: CFRoutes.EXPLORE,
            state: exploreTemplateFilters
          }
        }}
        sx={{ marginTop: projects.length ? 0 : 4 }}
      >
        <Alert
          sx={{ mb: 3 }}
          severity="info"
          title={t('templates.howToTitle')}
          subtitle={t('templates.howToHelp')}
          hideIfCookie={CookieTypes.HIDE_HOME_HOWTO_TEMPLATE_MESSAGE}
        />
        <GridWrap>
          {formattedTemplates.map((item) => (
            <WorkflowCardWrapper key={`template-${item.uuid}`} {...item} />
          ))}
        </GridWrap>
      </Section>
    </OuterContentWrap>
  )
}

export default Home
