import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { CFRoutes, RelativeRoutes } from '@cf/router/appRoutes'
import { WorkflowViewType } from '@cf/types/enum'
import * as Utility from '@cf/utility/utilityFunctions'
import { _t } from '@cf/utility/utilityFunctions'
import AlignmentView from '@cfViews/WorkflowView/componentViews/AlignmentView/AlignmentView'
import CompetencyMatrixView from '@cfViews/WorkflowView/componentViews/CompetencyMatrixView/CompetencyMatrixView'
import GridView from '@cfViews/WorkflowView/componentViews/GridView/GridView'
import OutcomeEditView from '@cfViews/WorkflowView/componentViews/OutcomeEditView/OutcomeEditView'
import OutcomeTableView from '@cfViews/WorkflowView/componentViews/OutcomeTableView'
import OverviewView from '@cfViews/WorkflowView/componentViews/OverviewView'
import dummyOverviewData from '@cfViews/WorkflowView/componentViews/OverviewView/dummyData'
import WorkflowView from '@cfViews/WorkflowView/componentViews/WorkflowView'
import { Tab } from '@mui/material'
import { ReactNode, useContext } from 'react'
import * as React from 'react'
import { Route, generatePath, useNavigate, useParams } from 'react-router-dom'

const useWorkflowTabs = ({ data }: { data: any }) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { setWorkflowView, workflowView } = useContext(WorkFlowConfigContext)

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
      type: WorkflowViewType.WORKFLOW_OVERVIEW,
      route: CFRoutes.WORKFLOW,
      relRoute: RelativeRoutes.INDEX,
      label: _t('Workflow Overview'),
      content: <OverviewView {...dummyOverviewData} />,
      allowedTabs: [3]
    },
    {
      type: WorkflowViewType.WORKFLOW,
      route: CFRoutes.WORKFLOW_WORKFLOW,
      relRoute: RelativeRoutes.WORKFLOW,
      label: _t('Workflow View'),
      content: <WorkflowView />,
      allowedTabs: [1, 2, 3, 4] // if context.permissions.workflowPermissions.readOnly [2,3]
    },
    {
      type: WorkflowViewType.OUTCOME_EDIT,
      route: CFRoutes.WORKFLOW_OUTCOME_EDIT,
      relRoute: RelativeRoutes.OUTCOME_EDIT,
      label: Utility.capWords(_t('View') + ' ' + _t(data.type + ' outcomes')),
      content: <OutcomeEditView />,
      allowedTabs: data.type == 'program' ? [3] : [2, 3]
    },
    {
      type: WorkflowViewType.OUTCOMETABLE,
      route: CFRoutes.WORKFLOW_OUTCOMETABLE,
      relRoute: RelativeRoutes.OUTCOMETABLE,
      label: Utility.capWords(_t(data.type + ' outcome') + ' ' + _t('Table')),
      content:
        data.table_type === 1 ? <CompetencyMatrixView /> : <OutcomeTableView />,
      allowedTabs: [3]
    },
    {
      type: WorkflowViewType.ALIGNMENTANALYSIS,
      route: CFRoutes.WORKFLOW_ALIGNMENTANALYSIS,
      relRoute: RelativeRoutes.ALIGNMENTANALYSIS,
      label: Utility.capWords(
        _t(data.type + ' outcome') + ' ' + _t('Analytics')
      ),
      content: <AlignmentView />,
      allowedTabs: [3],
      disabled: ['activity'].includes(data.type)
    },
    {
      type: WorkflowViewType.GRID,
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
    .map((item, index) => {
      return (
        <Tab
          label={item.label}
          value={item.type}
          onClick={() => {
            //  setWorkflowView(item.type)
            setWorkflowView(item.type) // Update the context
            const path = generatePath(item.route, { id })
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
