import { ViewType } from '@cf/types/enum'
import * as React from 'react'
import * as Utility from '@cf/utility/utilityFunctions'
import AlignmentView from '@cfViews/WorkflowView/componentViews/AlignmentView/AlignmentView'
import CompetencyMatrixView from '@cfViews/WorkflowView/componentViews/CompetencyMatrixView/CompetencyMatrixView'
import OutcomeTableView from '@cfViews/WorkflowView/componentViews/OutcomeTableView'
import GridView from '@cfViews/WorkflowView/componentViews/GridView/GridView'
import WorkflowView from '@cfViews/WorkflowView/componentViews/WorkflowView'
import OutcomeEditView from '@cfViews/WorkflowView/componentViews/OutcomeEditView/OutcomeEditView'
import { useContext, useState } from 'react'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { Box, Tab, Tabs } from '@mui/material'
import { OuterContentWrap } from '@cf/mui/helper'
import {
  generatePath,
  useLocation,
  useNavigate,
  useParams
} from 'react-router-dom'
import { Routes as AppRoutes } from '@cf/router'
import OverviewView from '@cfViews/WorkflowView/componentViews/OverviewView'
import dummyOverviewData from '@cfViews/WorkflowView/componentViews/OverviewView/dummyData'
import { _t } from '@cf/utility/utilityFunctions'

const ViewTabButtons = ({
  data,
  changeView
}: {
  data: any
  changeView: any
}) => {
  const context = useContext(WorkFlowConfigContext)

  const viewButtons = [
    {
      type: ViewType.WORKFLOW,
      name: _t('Workflow View'),
      disabled: []
    },
    {
      type: ViewType.OUTCOME_EDIT,
      name: Utility.capWords(_t('View') + ' ' + _t(data.type + ' outcomes')),
      disabled: []
    },
    {
      type: ViewType.OUTCOMETABLE,
      name: Utility.capWords(_t(data.type + ' outcome') + ' ' + _t('Table')),
      disabled: []
    },
    {
      type: ViewType.ALIGNMENTANALYSIS,
      name: Utility.capWords(
        _t(data.type + ' outcome') + ' ' + _t('Analytics')
      ),
      disabled: ['activity']
    },
    {
      type: ViewType.GRID,
      name: _t('Grid View'),
      disabled: ['activity', 'course']
    }
  ]
    .filter((item) => item.disabled.indexOf(data.type) == -1)
    .map((item, index) => {
      let view_class = 'hover-shade'
      if (item.type === context.viewType) view_class += ' active'
      return (
        <a
          key={index}
          id={'button_' + item.type}
          className={view_class}
          onClick={changeView.bind(this, item.type)}
        >
          {item.name}
        </a>
      )
    })

  return viewButtons
}

const WorkflowContent = ({
  viewType,
  data
}: {
  viewType: ViewType
  data: any
}) => {
  const allowedTabs: number[] = []
  const context = useContext(WorkFlowConfigContext)

  switch (viewType) {
    case ViewType.ALIGNMENTANALYSIS: {
      allowedTabs.push(3)
      return <AlignmentView />
    }
    case ViewType.OUTCOMETABLE: {
      allowedTabs.push(3)
      if (data.table_type === 1) {
        return <CompetencyMatrixView />
      }
      return <OutcomeTableView />
    }
    case ViewType.OUTCOME_EDIT: {
      if (data.type == 'program') {
        allowedTabs.push(3)
      } else {
        allowedTabs.push(2, 3)
      }
      return <OutcomeEditView />
    }

    case ViewType.GRID: {
      allowedTabs.push(3)
      return <GridView />
    }
    case ViewType.WORKFLOW_OVERVIEW: {
      allowedTabs.push(3)
      return <OverviewView {...dummyOverviewData} />
    }
    case ViewType.WORKFLOW: {
      allowedTabs.push(1, 2, 3, 4)
      if (context.permissions.workflowPermission.readOnly) {
        allowedTabs.push(2, 3)
      }
      return <WorkflowView />
    }
    default:
      return <>case not handled </>
  }
}

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
  const location = useLocation()
  const [tab, setTab] = useState<ViewType>(viewType)
  const navigate = useNavigate()
  const { id } = useParams()

  if (isStrategy) {
    return <WorkflowContent viewType={viewType} data={data} />
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
            <Tab
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
            />
          </Tabs>
        </OuterContentWrap>
      </Box>

      <div className="workflow-container">
        <div className="workflow-view-select hide-print">
          <ViewTabButtons data={data} changeView={changeView} />
        </div>
        <WorkflowContent viewType={viewType} data={data} />
      </div>
    </>
  )
}

export default WorkflowViewTabs
