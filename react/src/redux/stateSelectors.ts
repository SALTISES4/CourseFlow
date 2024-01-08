import { AppState, Columnworkflow } from '@cfRedux/type'

export type ColumnWorkflowByIDType = {
  data?: Columnworkflow
  order?: number[]
}
export const getColumnWorkflowByID = (
  state: AppState,
  id: number
): ColumnWorkflowByIDType => {
  for (const i in state.columnworkflow) {
    const columnWorkflow = state.columnworkflow[i]
    if (columnWorkflow.id === id) {
      return {
        data: columnWorkflow,
        order: state.workflow.columnworkflow_set
      }
    }
  }

  return {
    data: undefined,
    order: undefined
  }
}

export type StrategyByIDType = {
  data: any // don't have type for strategy
}
export const getStrategyByID = (
  state: AppState,
  id: number
): StrategyByIDType => {
  const strategies = Object.values(state.strategy)
  const foundStrategy = strategies.find((strategy) => strategy.id === id)
  return foundStrategy ? { data: foundStrategy } : { data: undefined }
}
