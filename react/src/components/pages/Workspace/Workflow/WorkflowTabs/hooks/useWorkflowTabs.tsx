import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { CFRoutes, RelativeRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/utilityFunctions'
import { WorkflowViewType } from '@cfPages/Workspace/Workflow/types'
import AlignmentView from '@cfViews/WorkflowView/componentViews/AlignmentView/AlignmentView'
import CompetencyMatrixView from '@cfViews/WorkflowView/componentViews/CompetencyMatrixView/CompetencyMatrixView'
import GridView from '@cfViews/WorkflowView/componentViews/GridView/GridView'
import OutcomeEditView from '@cfViews/WorkflowView/componentViews/OutcomeEditView/OutcomeEditView'
import OutcomeTableView from '@cfViews/WorkflowView/componentViews/OutcomeTableView'
import OverviewView from '@cfViews/WorkflowView/componentViews/OverviewView'
import WorkflowView from '@cfViews/WorkflowView/componentViews/WorkflowView'
import { Tab } from '@mui/material'
import { ReactNode, useContext } from 'react'
import { Route, generatePath, useNavigate, useParams } from 'react-router-dom'

const useWorkflowTabs = ({ data }: { data: any }) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { setWorkflowView } = useContext(WorkFlowConfigContext)

  const tabs: {
    type: WorkflowViewType
    route: CFRoutes
    relRoute: RelativeRoutes
    label: string
    content: ReactNode
    allowedTabs: number[]
    disabled?: boolean
  }[] = [
    {
      type: WorkflowViewType.OVERVIEW,
      route: CFRoutes.WORKFLOW,
      relRoute: RelativeRoutes.INDEX,
      label: _t('Overview'),
      content: <OverviewView />,
      allowedTabs: [3]
    },
    {
      type: WorkflowViewType.WORKFLOW,
      route: CFRoutes.WORKFLOW_WORKFLOW,
      relRoute: RelativeRoutes.WORKFLOW,
      label: _t('Workflows'),
      content: <WorkflowView />,
      allowedTabs: [1, 2, 3, 4] // if context.permissions.workflowPermissions.readOnly [2,3]
    },
    {
      type: WorkflowViewType.OUTCOME_EDIT,
      route: CFRoutes.WORKFLOW_OUTCOME_EDIT,
      relRoute: RelativeRoutes.OUTCOME_EDIT,
      label: _t('Outcomes'),
      content: <OutcomeEditView />,
      allowedTabs: data.type == 'program' ? [3] : [2, 3]
    },
    {
      type: WorkflowViewType.OUTCOME_TABLE,
      route: CFRoutes.WORKFLOW_OUTCOME_TABLE,
      relRoute: RelativeRoutes.OUTCOME_TABLE,
      label: _t('Outcome Table'),
      content:
        data.table_type === 1 ? <CompetencyMatrixView /> : <OutcomeTableView />,
      allowedTabs: [3]
    },
    {
      type: WorkflowViewType.ALIGNMENT_ANALYSIS,
      route: CFRoutes.WORKFLOW_ALIGNMENT_ANALYSIS,
      relRoute: RelativeRoutes.ALIGNMENT_ANALYSIS,
      label: _t('Outcome Analytics'),
      content: <AlignmentView />,
      allowedTabs: [3],
      disabled: ['activity'].includes(data.type)
    },
    {
      type: WorkflowViewType.GRID_VIEW,
      route: CFRoutes.WORKFLOW_GRID,
      relRoute: RelativeRoutes.GRID,
      label: _t('Grid View'),
      content: <GridView />,
      allowedTabs: [3],
      disabled: ['activity', 'course'].includes(data.type)
    }
  ]

  const tabButtons = tabs
    .filter((item) => !item.disabled)
    .map((item, index) => (
      <Tab
        key={index}
        label={item.label}
        value={item.type}
        onClick={() => {
          setWorkflowView(item.type)
          const path = generatePath(item.route, { id })
          navigate(path)
        }}
      />
    ))

  const tabRoutes = tabs
    .filter((item) => !item.disabled)
    .map((item, index) => (
      <Route
        key={index}
        index={item.relRoute === RelativeRoutes.INDEX}
        path={item.relRoute}
        element={item.content}
      />
    ))

  return { tabRoutes, tabButtons, tabs }
}

export default useWorkflowTabs
