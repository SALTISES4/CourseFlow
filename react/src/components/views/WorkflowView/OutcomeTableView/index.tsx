import { selectOutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { RootState } from '@cf/redux/store'
import { OuterContentWrap } from '@cfMUI/helper'
import { type WorkflowPageData } from '@cfPages/Workflow/types'
import { memo } from 'react'
import { useSelector } from 'react-redux'

import * as Styled from './styles'
import TableBody from './TableBody'
import TableHeader from './TableHeader'

const OutcomeTableView = ({ workflow }: { workflow: WorkflowPageData }) => {
  const viewType = useSelector(
    (state: RootState) => state.graph.outcomeTableUi.viewType
  )
  const outcomeTable = useSelector((state: RootState) =>
    selectOutcomeTable(state, workflow.graphUuid)
  )

  return (
    <OuterContentWrap sx={{ pt: 4 }} data-test-id="workflow-outcome-table-view">
      <Styled.TableWrap>
        <TableHeader viewType={viewType} table={outcomeTable} />
        <TableBody viewType={viewType} table={outcomeTable} />
      </Styled.TableWrap>
    </OuterContentWrap>
  )
}

export default memo(OutcomeTableView)
