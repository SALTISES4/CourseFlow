import { ViewType } from '@cfModule/types/enum'
import * as React from 'react'
import * as Utility from '@cfModule/utility/utilityFunctions'
import AlignmentView from '@cfViews/WorkflowView/componentViews/AlignmentView/AlignmentView'
import CompetencyMatrixView from '@cfViews/WorkflowView/componentViews/CompetencyMatrixView/CompetencyMatrixView'
import OutcomeTableView from '@cfViews/WorkflowView/componentViews/OutcomeTableView/OutcomeTableView'
import GridView from '@cfViews/WorkflowView/componentViews/GridView/GridView'
import WorkflowView from '@cfViews/WorkflowView/componentViews/WorkflowView'
import OutcomeEditView from '@cfViews/WorkflowView/componentViews/OutcomeEditView/OutcomeEditView'
import { useContext } from 'react'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'

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
      name: window.gettext('Workflow View'),
      disabled: []
    },
    {
      type: ViewType.OUTCOME_EDIT,
      name: Utility.capWords(
        window.gettext('View') + ' ' + window.gettext(data.type + ' outcomes')
      ),
      disabled: []
    },
    {
      type: ViewType.OUTCOMETABLE,
      name: Utility.capWords(
        window.gettext(data.type + ' outcome') + ' ' + window.gettext('Table')
      ),
      disabled: []
    },
    {
      type: ViewType.ALIGNMENTANALYSIS,
      name: Utility.capWords(
        window.gettext(data.type + ' outcome') +
          ' ' +
          window.gettext('Analytics')
      ),
      disabled: ['activity']
    },
    {
      type: ViewType.GRID,
      name: window.gettext('Grid View'),
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
      // @ts-ignore figure out table type origin
      if (this.data.table_type === 1) {
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
    default: {
      allowedTabs.push(1, 2, 3, 4)
      if (context.permissions.workflowPermission.readOnly) {
        allowedTabs.push(2, 3)
      }
      return <WorkflowView />
    }
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
  if (isStrategy) {
    return <WorkflowContent viewType={viewType} data={data} />
  }

  return (
    <div className="workflow-container">
      <div className="workflow-view-select hide-print">
        <ViewTabButtons data={data} changeView={changeView} />
      </div>
      <WorkflowContent viewType={viewType} data={data} />
    </div>
  )
}

export default WorkflowViewTabs
