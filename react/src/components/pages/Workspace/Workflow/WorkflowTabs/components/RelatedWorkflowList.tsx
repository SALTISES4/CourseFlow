import { listWorkflowsOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import * as MainSidebar from '@cf/components/common/globalNav/MainSidebar/styles'
import { _t } from '@cf/utility/Utility.class'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { workflowUrl } from '@cfComponents/UIPrimitives/Titles'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

type WorkflowNode = {
  id: string
  title: string
  description: string
  url: string
  deleted: boolean
}
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
  const { uuid } = useParams()

  // const { data: childData, isLoading: childIsLoading } =
  //   useListRelatedWorkflowParentsQuery({ uuid: uuid }, { skip: !uuid })
  //
  // const { data: parentData, isLoading: parentIsLoading } =
  //   useListRelatedWorkflowChildrenQuery({ uuid: uuid }, { skip: !uuid })

  const childQuery = useQuery({
    ...listWorkflowsOptions({
      query: {
        projectUuid: uuid,
        page: 1
      }
    }),
    enabled: false
  })

  const parentQuery = useQuery({
    ...listWorkflowsOptions({
      query: {
        projectUuid: uuid,
        page: 1
      }
    }),
    enabled: false
  })

  if (!uuid) {
    return null
  }

  /*******************************************************
   * RENDER COMPONENTS
   *******************************************************/
  const ParentWorkflows = () => {
    if (parentQuery.isLoading) {
      return <Loader />
    }

    if (!parentQuery.data || !parentQuery.data.items.length) {
      return <></>
    }

    const parentWorkflows = Array.from(
      new Map(
        (parentQuery.data.items as WorkflowNode[]).map((workflow) => [
          workflow.id,
          workflow
        ])
      ).values()
    )

    return (
      <>
        <Divider sx={{ mt: 2 }} />
        <MainSidebar.SectionWrap>
          <MainSidebar.SectionLabel variant="body1">
            {_t('Appears in')}
          </MainSidebar.SectionLabel>
          <List data-test-id="panel-other-worflows">
            {parentWorkflows.map((workflow) => {
              const url = workflowUrl(workflow)
              return (
                <ListItem disablePadding dense key={workflow.id}>
                  <ListItemButton
                    component={Link}
                    to={url}
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
    if (childQuery.isLoading) {
      return <Loader />
    }

    if (!childQuery.data || childQuery.data.items.length) {
      return <></>
    }

    return (
      <>
        <Divider sx={{ mt: 2 }} />
        <MainSidebar.SectionWrap>
          <MainSidebar.SectionLabel variant="body1">
            {_t('Contains')}
          </MainSidebar.SectionLabel>
          <List>
            {childQuery.data.items.map((workflow) => {
              const url = workflowUrl(workflow)
              return (
                <ListItem disablePadding dense key={workflow.uuid}>
                  <ListItemButton
                    component={Link}
                    to={url}
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
