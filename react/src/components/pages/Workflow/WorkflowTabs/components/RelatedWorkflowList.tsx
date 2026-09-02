import { getRelatedWorkflowsOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import * as MainSidebar from '@cfComponents/globalNav/MainSidebar/styles'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { workflowUrl } from '@cfComponents/UIPrimitives/Titles'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/**
 * https://courseflow-staging.mydalite.org/course-flow/workflow/19
 * There are two parts:
 *
 * Child linked workflows: for current workflow context, show workflow linked to by nodes in current workflow
 *  ex: if current workflow is course, and has a node which is linked to an activity, that activity is listed
 *
 * Parent linking workflows: for current workflow context, list any workflows that are linked to by nodes owned by current workflow

 */
const RelatedWorkflowList = () => {
  const { t } = useTranslation('workflow')
  const { uuid } = useParams()

  const relatedQuery = useQuery({
    ...getRelatedWorkflowsOptions({ path: { uuid: uuid ?? '' } }),
    enabled: Boolean(uuid)
  })

  if (!uuid) {
    return null
  }

  /*******************************************************
   * RENDER COMPONENTS
   *******************************************************/
  const ParentWorkflows = () => {
    if (relatedQuery.isLoading) {
      return <Loader />
    }

    if (!relatedQuery.data?.appearsIn.length) {
      return <></>
    }

    return (
      <>
        <Divider sx={{ mt: 2 }} />
        <MainSidebar.SectionWrap>
          <MainSidebar.SectionLabel variant="body1">
            {t('related.appearsIn')}
          </MainSidebar.SectionLabel>
          <List data-test-id="panel-other-worflows">
            {relatedQuery.data.appearsIn.map((workflow) => {
              const url = workflowUrl(workflow)
              return (
                <ListItem disablePadding dense key={workflow.uuid}>
                  <ListItemButton
                    component={Link}
                    to={url}
                    target="_blank"
                    rel="noreferrer"
                    selected={location.pathname === url}
                  >
                    <ListItemText primary={workflow.title} />
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
        </MainSidebar.SectionWrap>
      </>
    )
  }

  const ChildWorkflows = () => {
    if (relatedQuery.isLoading) {
      return <Loader />
    }

    if (!relatedQuery.data?.contains.length) {
      return <></>
    }

    return (
      <>
        <Divider sx={{ mt: 2 }} />
        <MainSidebar.SectionWrap>
          <MainSidebar.SectionLabel variant="body1">
            {t('related.contains')}
          </MainSidebar.SectionLabel>
          <List>
            {relatedQuery.data.contains.map((workflow) => {
              const url = workflowUrl(workflow)
              return (
                <ListItem disablePadding dense key={workflow.uuid}>
                  <ListItemButton
                    component={Link}
                    to={url}
                    target="_blank"
                    rel="noreferrer"
                    data-test-id="panel-other-worflows"
                    selected={location.pathname === url}
                  >
                    <ListItemText primary={workflow.title} />
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
        </MainSidebar.SectionWrap>
      </>
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  // @todo this is causing fails when we move between tabs
  return (
    <>
      <ChildWorkflows />
      <ParentWorkflows />
    </>
  )
}

export default RelatedWorkflowList
