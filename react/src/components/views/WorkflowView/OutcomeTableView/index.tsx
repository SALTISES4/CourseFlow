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

const OutcomeTableView = ({ workflow }: { workflow: WorkflowPageData }) => {
  const viewType = useSelector(
    (state: RootState) => state.graph.outcomeTableUi.viewType
  )

  return (
    <OuterContentWrap sx={{ pt: 4 }} data-test-id="workflow-outcome-table-view">
      {viewType === 'matrix' && (
        <Styled.TableWrap className="view-matrix">
          <TableHeaderMatrix graphUuid={workflow.graphUuid} />
          <TableBodyMatrix graphUuid={workflow.graphUuid} />
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
