import { WorkflowViewType } from '@cf/types/enum'
import * as React from 'react'
import { ReactNode, useContext, useEffect } from 'react'
import * as Utility from '@cf/utility/utilityFunctions'
import { _t } from '@cf/utility/utilityFunctions'
import AlignmentView from '@cfViews/WorkflowView/componentViews/AlignmentView/AlignmentView'
import CompetencyMatrixView from '@cfViews/WorkflowView/componentViews/CompetencyMatrixView/CompetencyMatrixView'
import OutcomeTableView from '@cfViews/WorkflowView/componentViews/OutcomeTableView'
import GridView from '@cfViews/WorkflowView/componentViews/GridView/GridView'
import WorkflowView from '@cfViews/WorkflowView/componentViews/WorkflowView'
import OutcomeEditView from '@cfViews/WorkflowView/componentViews/OutcomeEditView/OutcomeEditView'
import { Tab, Tabs } from '@mui/material'
import {
  generatePath,
  matchPath,
  Route,
  useNavigate,
  useParams
} from 'react-router-dom'
import { RelativeRoutes, CFRoutes as AppRoutes } from '@cf/router'
import OverviewView from '@cfViews/WorkflowView/componentViews/OverviewView'
import dummyOverviewData from '@cfViews/WorkflowView/componentViews/OverviewView/dummyData'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import useInitializeWorkflowView from '@cf/hooks/useInitializeWorkflowView'

const useWorkflowTabs = ({ data }: { data: any }) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { setWorkflowView, workflowView } = useContext(WorkFlowConfigContext)

  const tabs: {
    type: WorkflowViewType
    route: AppRoutes
    relRoute: RelativeRoutes
    name: string
    content: ReactNode
    allowedTabs: number[]
    disabled?: boolean
  }[] = [
    {
      type: WorkflowViewType.WORKFLOW_OVERVIEW,
      route: AppRoutes.WORKFLOW_OVERVIEW,
      relRoute: RelativeRoutes.INDEX,
      name: _t('Workflow Overview'),
      content: <OverviewView {...dummyOverviewData} />,
      allowedTabs: [3]
    },
    {
      type: WorkflowViewType.WORKFLOW,
      route: AppRoutes.WORKFLOW_WORKFLOW,
      relRoute: RelativeRoutes.WORKFLOW,
      name: _t('Workflow View'),
      content: <WorkflowView />,
      allowedTabs: [1, 2, 3, 4] // if context.permissions.workflowPermission.readOnly [2,3]
    },
    {
      type: WorkflowViewType.OUTCOME_EDIT,
      route: AppRoutes.WORKFLOW_OUTCOME_EDIT,
      relRoute: RelativeRoutes.OUTCOME_EDIT,
      name: Utility.capWords(_t('View') + ' ' + _t(data.type + ' outcomes')),
      content: <OutcomeEditView />,
      allowedTabs: data.type == 'program' ? [3] : [2, 3]
    },
    {
      type: WorkflowViewType.OUTCOMETABLE,
      route: AppRoutes.WORKFLOW_OUTCOMETABLE,
      relRoute: RelativeRoutes.OUTCOMETABLE,
      name: Utility.capWords(_t(data.type + ' outcome') + ' ' + _t('Table')),
      content:
        data.table_type === 1 ? <CompetencyMatrixView /> : <OutcomeTableView />,
      allowedTabs: [3]
    },
    {
      type: WorkflowViewType.ALIGNMENTANALYSIS,
      route: AppRoutes.WORKFLOW_ALIGNMENTANALYSIS,
      relRoute: RelativeRoutes.ALIGNMENTANALYSIS,
      name: Utility.capWords(
        _t(data.type + ' outcome') + ' ' + _t('Analytics')
      ),
      content: <AlignmentView />,
      allowedTabs: [3],
      disabled: ['activity'].includes(data.type)
    },
    {
      type: WorkflowViewType.GRID,
      route: AppRoutes.WORKFLOW_GRID,
      relRoute: RelativeRoutes.GRID,
      name: _t('Grid View'),
      content: <GridView />,
      allowedTabs: [3],
      disabled: ['activity', 'course'].includes(data.type)
    }
  ]

  const tabButtons = tabs
    .filter((item) => !item.disabled)
    .map((item, index) => {
      return (
        <Tab
          label={item.name}
          value={item.type}
          onClick={() => {
            //  setWorkflowView(item.type)
            setWorkflowView(item.type) // Update the context
            const path = generatePath(item.route, { id, '*': null })
            navigate(path) // Navigate to the corresponding route
          }}
        />
      )
    })

  const tabRoutes = tabs
    .filter((item) => !item.disabled)
    .map((item, index) => {
      return (
        <Route
          index={item.relRoute === RelativeRoutes.INDEX}
          path={item.relRoute}
          element={item.content}
        />
      )
    })

  return { tabRoutes, tabButtons, tabs }
}

export default useWorkflowTabs
