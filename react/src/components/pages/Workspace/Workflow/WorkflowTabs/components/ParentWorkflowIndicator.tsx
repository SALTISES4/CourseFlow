import { _t } from '@cf/utility/Utility.class'
import * as SC from '@cfComponents/globalNav/Sidebar/styles'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { workflowUrl } from '@cfComponents/UIPrimitives/Titles'
import { AppState } from '@cfRedux/types/type'
import { TGetNodeById } from '@cfFindState'
import {
  selectAllNodes,
  selectNodeById
} from '@cfRedux/selectors/node.selector'
import { selectWeekById } from '@cfRedux/selectors/week.selector'
import { RootState } from '@cfRedux/store'
import { AppState, TNode } from '@cfRedux/types/type'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import { useGetParentWorkflowInfoQuery } from '@XMLHTTP/API/workflowObjects/workflow.rtk'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'

type WorkflowNode = {
  id: number
  title: string
  description: string
  url: string
  deleted: boolean
}

const ParentWorkflowIndicator = () => {
  const { id } = useParams()
  //  const nodes = useSelector<AppState, TNode[]>((state) => state.workspace.node)
  const nodes = useSelector((state: RootState) => selectAllNodes(state))
  const childWorkflows: WorkflowNode[] = nodes
    .filter((node) => node.linkedWorkflowData)
    .map((node) => ({
      id: node.linkedWorkflow,
      title: node.linkedWorkflowData?.title || '',
      description: node.linkedWorkflowData?.description || '',
      url: node.linkedWorkflowData?.url || '',
      deleted: node.linkedWorkflowData?.deleted || false
    }))

  const { data, error, isLoading, isError } = useGetParentWorkflowInfoQuery(
    {
      id: Number(id)
    },
    {
      skip: !id
    }
  )

  if (!id) {
    return null
  }

  /*******************************************************
   * RENDER COMPONENTS
   *******************************************************/
  const ParentWorkflows = () => {
    if (isLoading) {
      return <Loader />
    }

    if (!data || !data.parentWorkflows.length) {
      return <></>
    }

    return (
      <>
        <Divider />
        <SC.SectionWrap>
          <SC.SectionLabel variant="body1">
            {_t('Workflows used')}
          </SC.SectionLabel>
          <List data-test-id="panel-other-worflows">
            {data.parentWorkflows.map((workflow) => {
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
        </SC.SectionWrap>
      </>
    )
  }

  const ChildWorkflows = () => {
    if (!childWorkflows.length) {
      return <></>
    }

    return (
      <>
        <Divider />
        <SC.SectionWrap>
          <SC.SectionLabel variant="body1">
            {_t('Used in this Workflow')}
          </SC.SectionLabel>
          <List>
            {childWorkflows.map((workflow, index) => {
              const url = workflowUrl(workflow)
              return (
                <ListItem disablePadding dense key={workflow.id}>
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
        </SC.SectionWrap>
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

export default ParentWorkflowIndicator
