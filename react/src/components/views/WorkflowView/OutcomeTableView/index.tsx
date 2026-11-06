import { selectOutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { RootState } from '@cf/redux/store'
import Alert from '@cfComponents/UIPrimitives/Alert'
import { OuterContentWrap } from '@cfMUI/helper'
import { type WorkflowPageData } from '@cfPages/Workflow/types'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import PresentationControls from './PresentationControls'
import * as Styled from './styles'
import TableBodyMatrix from './TableBodyMatrix'
import TableBodyNormal from './TableBodyNormal'
import TableHeaderMatrix from './TableHeaderMatrix'
import TablheHeaderNormal from './TableHeaderNormal'

export type WorkflowType = WorkflowPageData['workflowType']

const OutcomeTableView = ({
  workflow,
  publicView = false
}: {
  workflow: WorkflowPageData
  publicView?: boolean
}) => {
  const { t } = useTranslation('workflow')
  const viewType = useSelector(
    (state: RootState) => state.graph.outcomeTableUi.viewType
  )
  const workflowType = workflow.workflowType
  const table = useSelector((state: RootState) =>
    selectOutcomeTable(state, workflow.graphUuid)
  )

  if (
    table.outcomeTree.groups.length === 0 ||
    Object.keys(table.entities.nodes).length === 0
  ) {
    return (
      <OuterContentWrap
        sx={{ pt: 4 }}
        data-test-id="workflow-outcome-table-view"
      >
        <Alert
          severity="warning"
          persistent
          title={t('outcomeTable.emptyWarningTitle')}
          subtitle={t('outcomeTable.emptyWarningSubtitle')}
        />
      </OuterContentWrap>
    )
  }

  return (
    <OuterContentWrap sx={{ pt: 4 }} data-test-id="workflow-outcome-table-view">
      {publicView && <PresentationControls graphUuid={workflow.graphUuid} />}
      {viewType === 'matrix' && (
        <Styled.TableWrap className="view-matrix">
          <TableHeaderMatrix workflowType={workflowType} table={table} />
          <TableBodyMatrix workflowType={workflowType} table={table} />
        </Styled.TableWrap>
      )}
      {viewType === 'normal' && (
        <Styled.TableWrap className="view-normal">
          <TablheHeaderNormal table={table} />
          <TableBodyNormal table={table} />
        </Styled.TableWrap>
      )}
    </OuterContentWrap>
  )
}

export default memo(OutcomeTableView)
