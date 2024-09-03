import { ViewType } from '@cf/types/enum'
import * as React from 'react'
import * as Utility from '@cf/utility/utilityFunctions'
import AlignmentView from '@cfViews/WorkflowView/componentViews/AlignmentView/AlignmentView'
import CompetencyMatrixView from '@cfViews/WorkflowView/componentViews/CompetencyMatrixView/CompetencyMatrixView'
import OutcomeTableView from '@cfViews/WorkflowView/componentViews/OutcomeTableView'
import GridView from '@cfViews/WorkflowView/componentViews/GridView/GridView'
import WorkflowView from '@cfViews/WorkflowView/componentViews/WorkflowView'
import OutcomeEditView from '@cfViews/WorkflowView/componentViews/OutcomeEditView/OutcomeEditView'
import { ReactNode, useContext, useState } from 'react'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { Box, Tab, Tabs } from '@mui/material'
import { OuterContentWrap } from '@cf/mui/helper'
import {
  generatePath,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams
} from 'react-router-dom'
import { Routes as AppRoutes } from '@cf/router'
import OverviewView from '@cfViews/WorkflowView/componentViews/OverviewView'
import dummyOverviewData from '@cfViews/WorkflowView/componentViews/OverviewView/dummyData'
import { _t } from '@cf/utility/utilityFunctions'

const useTabs = ({ data, changeView }: { data: any; changeView: any }) => {
  const navigate = useNavigate()
  const { id } = useParams()

  const tabs: {
    type: ViewType
    route: AppRoutes
    name: string
    content: ReactNode
    allowedTabs: number[]
    disabled?: boolean
  }[] = [
    {
      type: ViewType.WORKFLOW_OVERVIEW,
      route: AppRoutes.WORKFLOW_OVERVIEW,
      name: _t('Workflow Overview'),
      content: <OverviewView {...dummyOverviewData} />,
      allowedTabs: [3]
    },
    {
      type: ViewType.WORKFLOW,
      route: AppRoutes.WORKFLOW_WORKFLOW,
      name: _t('Workflow View'),
      content: <WorkflowView />,
      allowedTabs: [1, 2, 3, 4] // if context.permissions.workflowPermission.readOnly [2,3]
    },
    {
      type: ViewType.OUTCOME_EDIT,
      route: AppRoutes.WORKFLOW_OUTCOME_EDIT,
      name: Utility.capWords(_t('View') + ' ' + _t(data.type + ' outcomes')),
      content: <OutcomeEditView />,
      allowedTabs: data.type == 'program' ? [3] : [2, 3]
    },
    {
      type: ViewType.OUTCOMETABLE,
      route: AppRoutes.WORKFLOW_OUTCOMETABLE,
      name: Utility.capWords(_t(data.type + ' outcome') + ' ' + _t('Table')),
      content:
        data.table_type === 1 ? <CompetencyMatrixView /> : <OutcomeTableView />,
      allowedTabs: [3]
    },
    {
      type: ViewType.ALIGNMENTANALYSIS,
      route: AppRoutes.WORKFLOW_ALIGNMENTANALYSIS,
      name: Utility.capWords(
        _t(data.type + ' outcome') + ' ' + _t('Analytics')
      ),
      content: <AlignmentView />,
      allowedTabs: [3],
      disabled: ['activity'].includes(data.type)
    },
    {
      type: ViewType.GRID,
      route: AppRoutes.WORKFLOW_GRID,
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
            const path = generatePath(item.route, { id })
            navigate(path)
          }}
        />
      )
    })

  const tabRoutes = tabs
    .filter((item) => !item.disabled)
    .map((item, index) => {
      return <Route path={item.route} element={item.content} />
    })

  return { tabButtons, tabRoutes }
}

//

const WorkflowViewTabs = ({
  viewType,
  isStrategy,
  data,
  changeView
}: {
  viewType: ViewType
  isStrategy: boolean
  data: any
  changeView: any
}) => {
  console.log('viewType')
  console.log(viewType)

  const location = useLocation()
  const [tab, setTab] = useState<ViewType>(viewType)
  const navigate = useNavigate()
  const { id } = useParams()
  const { tabRoutes, tabButtons } = useTabs({ data, changeView })

  if (isStrategy) {
    //  return <WorkflowContent viewType={viewType} data={data} />
  }

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <OuterContentWrap sx={{ pb: 0 }}>
          <Tabs
            value={tab}
            onChange={(_, newValue: ViewType) => {
              setTab(newValue)
              changeView(newValue)
            }}
          >
            {tabButtons}
            {/* <Tab
              label="Overview"
              value={ViewType.WORKFLOW_OVERVIEW}
              onClick={() => {
                const path = generatePath(AppRoutes.WORKFLOW_OVERVIEW, { id })
                navigate(path)
              }}
            />
            <Tab
              label="Workflows"
              value={ViewType.WORKFLOW}
              onClick={() => {
                const path = generatePath(AppRoutes.WORKFLOW_WORKFLOW, { id })
                navigate(path)
              }}
            />
            <Tab
              label="Workspaces"
              value={ViewType.OUTCOME_EDIT}
              onClick={() => {
                const path = generatePath(AppRoutes.WORKFLOW_OUTCOME_EDIT, {
                  id
                })
                navigate(path)
              }}
            />*/}
          </Tabs>
        </OuterContentWrap>
      </Box>

      <div className="workflow-container">
        <Routes>
          {/*  {tabRoutes}*/}
          <Route
            path={'/'}
            // element={<OverviewView {...dummyOverviewData} />}
            element={<>dfasdf</>}
          />
        </Routes>
      </div>
    </>
  )
}

export default WorkflowViewTabs

// const WorkflowContent = ({
//   viewType,
//   data
// }: {
//   viewType: ViewType
//   data: any
// }) => {
//   const allowedTabs: number[] = []
//   const context = useContext(WorkFlowConfigContext)
//
//   switch (viewType) {
//     case ViewType.ALIGNMENTANALYSIS: {
//       allowedTabs.push(3)
//       return <AlignmentView />
//     }
//     case ViewType.OUTCOMETABLE: {
//       allowedTabs.push(3)
//       if (data.table_type === 1) {
//         return <CompetencyMatrixView />
//       }
//       return <OutcomeTableView />
//     }
//     case ViewType.OUTCOME_EDIT: {
//       if (data.type == 'program') {
//         allowedTabs.push(3)
//       } else {
//         allowedTabs.push(2, 3)
//       }
//       return <OutcomeEditView />
//     }
//
//     case ViewType.GRID: {
//       allowedTabs.push(3)
//       return <GridView />
//     }
//     case ViewType.WORKFLOW_OVERVIEW: {
//       allowedTabs.push(3)
//       return <OverviewView {...dummyOverviewData} />
//     }
//     case ViewType.WORKFLOW: {
//       allowedTabs.push(1, 2, 3, 4)
//       if (context.permissions.workflowPermission.readOnly) {
//         allowedTabs.push(2, 3)
//       }
//       return <WorkflowView />
//     }
//     default:
//       return <>case not handled </>
//   }
// }
