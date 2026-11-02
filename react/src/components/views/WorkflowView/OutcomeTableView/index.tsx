import { selectOutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { RootState } from '@cf/redux/store'
import { OuterContentWrap } from '@cfMUI/helper'
import { type WorkflowPageData } from '@cfPages/Workflow/types'
import { memo } from 'react'
import { useSelector } from 'react-redux'

import * as Styled from './styles'
import TableBodyMatrix from './TableBodyMatrix'
import TableBodyNormal from './TableBodyNormal'
import TableHeaderMatrix from './TableHeaderMatrix'
import TablheHeaderNormal from './TableHeaderNormal'

export type WorkflowType = WorkflowPageData['workflowType']

const OutcomeTableView = ({ workflow }: { workflow: WorkflowPageData }) => {
  const viewType = useSelector(
    (state: RootState) => state.graph.outcomeTableUi.viewType
  )

  return (
    <OuterContentWrap sx={{ pt: 4 }} data-test-id="workflow-outcome-table-view">
      {viewType === 'matrix' && (
        <Styled.TableWrap className="view-matrix">
          <TableHeaderMatrix
            graphUuid={workflow.graphUuid}
            workflowType={workflow.workflowType}
          />
          <TableBodyMatrix
            graphUuid={workflow.graphUuid}
            workflowType={workflow.workflowType}
          />
        </Styled.TableWrap>
      )}
      {viewType === 'normal' && (
        <Styled.TableWrap className="view-normal">
          <TablheHeaderNormal graphUuid={workflow.graphUuid} />
          <TableBodyNormal graphUuid={workflow.graphUuid} />
        </Styled.TableWrap>
      )}
    </OuterContentWrap>
  )
}

export default memo(OutcomeTableView)
