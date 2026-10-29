import { selectOutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { RootState } from '@cf/redux/store'
import { OuterContentWrap } from '@cfMUI/helper'
import { type WorkflowPageData } from '@cfPages/Workflow/types'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import PresentationControls from './PresentationControls'
import * as Styled from './styles'
import TableBody from './TableBody'
import TableHeader from './TableHeader'

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
  const outcomeTable = useSelector((state: RootState) =>
    selectOutcomeTable(state, workflow.graphUuid)
  )

  return (
    <OuterContentWrap sx={{ pt: 4 }} data-test-id="workflow-outcome-table-view">
      {publicView && (
        <PresentationControls
          graphUuid={workflow.graphUuid}
          workflowType={workflow.workflowType}
        />
      )}
      <Styled.TableWrap
        role="grid"
        aria-label={t('outcomeTable.gridLabel')}
        data-test-id="workflow-outcome-table-grid"
        data-layout={viewType === 'normal' ? 'normal' : 'competency-matrix'}
      >
        <TableHeader
          viewType={viewType}
          table={outcomeTable}
          workflowType={workflow.workflowType}
        />
        <TableBody
          viewType={viewType}
          table={outcomeTable}
          workflowType={workflow.workflowType}
        />
      </Styled.TableWrap>
    </OuterContentWrap>
  )
}

export default memo(OutcomeTableView)
