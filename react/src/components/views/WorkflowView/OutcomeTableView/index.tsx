import { selectOutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { RootState } from '@cf/redux/store'
import { OuterContentWrap } from '@cfMUI/helper'
import { type WorkflowPageData } from '@cfPages/Workflow/types'
import { produce } from 'immer'
import { memo, useCallback, useState } from 'react'
import { useSelector } from 'react-redux'

import * as Styled from './styles'
import TableBody from './TableBody'
import TableHeader from './TableHeader'
import ViewToolbar from './Toolbar'

type StateType = {
  viewType: 'normal' | 'matrix'
}

const OutcomeTableView = ({ workflow }: { workflow: WorkflowPageData }) => {
  const [state, setState] = useState<StateType>({
    viewType: 'normal'
  })

  const outcomeTable = useSelector((state: RootState) =>
    selectOutcomeTable(state, workflow.graphUuid)
  )

  console.log('outcomeTree', outcomeTable.outcomeTree)

  const onViewTypeChange = useCallback((_, newVal: StateType['viewType']) => {
    if (!newVal) {
      return
    }

    setState(
      produce((draft) => {
        draft.viewType = newVal
      })
    )
  }, [])

  return (
    <OuterContentWrap sx={{ pt: 4 }} data-test-id="workflow-outcome-table-view">
      <ViewToolbar
        viewType={state.viewType}
        onViewTypeChange={onViewTypeChange}
      />

      <Styled.TableWrap>
        <TableHeader viewType={state.viewType} table={outcomeTable} />
        <TableBody viewType={state.viewType} table={outcomeTable} />
      </Styled.TableWrap>
    </OuterContentWrap>
  )
}

export default memo(OutcomeTableView)
