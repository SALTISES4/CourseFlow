import { CookieTypes } from '@cf/context/cookieContext'
import { GridWrap, OuterContentWrap } from '@cf/mui/helper'
import { CFRoutes } from '@cf/router'
import { _t } from '@cf/utility/utilityFunctions'
import Alert from '@cfComponents/UIPrimitives/Alert'
import WorkflowCardDumb, {
  PropsType as WorkflowCardDumbPropsType
} from '@cfPages/Styleguide/components/WorkflowCard'

import Section from './components/Section'
import Welcome from './components/Welcome'
import data from './data'

type PropsType = {
  projects: WorkflowCardDumbPropsType[]
  templates: WorkflowCardDumbPropsType[]
}

const Homepage = () => {
  const { projects, templates }: PropsType = data

  return (
    <OuterContentWrap>
      <Welcome hide={!!projects.length} />
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
            {projects.map((project, index) => (
              <WorkflowCardDumb key={index} {...project} chips={[]} />
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
          {templates.map((template, index) => (
            <WorkflowCardDumb key={index} {...template} />
          ))}
        </GridWrap>
      </Section>
    </OuterContentWrap>
  )
}

export default Homepage
