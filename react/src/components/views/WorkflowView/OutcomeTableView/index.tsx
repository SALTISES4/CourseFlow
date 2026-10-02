import { selectGraphBoard } from '@cf/features/graph/state/selectors/graphBoard.selectors'
import { RootState } from '@cf/redux/store'
import { OuterContentWrap } from '@cfMUI/helper'
import { type WorkflowPageData } from '@cfPages/Workflow/types'
import { produce } from 'immer'
import { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'

import ViewToolbar from './Toolbar'

type StateType = {
  viewType: 'normal' | 'matrix'
}

const OutcomeTableView = ({ workflow }: { workflow: WorkflowPageData }) => {
  const [state, setState] = useState<StateType>({
    viewType: 'normal'
  })

  const graphBoard = useSelector((state: RootState) =>
    selectGraphBoard(state, workflow.graphUuid)
  )

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
      <header></header>
    </OuterContentWrap>
  )
}

export default OutcomeTableView
