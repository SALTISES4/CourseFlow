import Utility from '@cf/utility/Utility.class'
import { getDropped } from '@cfRedux/selectors/helpers'
import { getNodeById } from '@cfRedux/selectors/node.selector'
import { getNodeWeekById } from '@cfRedux/selectors/nodeweek.selector'
import { AppState } from '@cfRedux/types/type'
import { createSelector } from 'reselect'

const selectWeekState = (state: AppState) => state.week
const selectTermId = (_: AppState, id: number) => id
const selectColumnWorkflowState = (state: AppState) => state.columnworkflow
const selectWorkflowState = (state: AppState) => state.workflow
const selectNodeWeekState = (state: AppState) => state.nodeweek

/**
 * Memoized selector to get a term by ID.
 */
export const getTermById = createSelector(
  [
    selectWeekState,
    selectTermId,
    selectColumnWorkflowState,
    selectWorkflowState,
    selectNodeWeekState
  ],
  (weeks, id, columnWorkflows, workflow, nodeweeks) => {
    const week = weeks.find((w) => w.id === id)

    if (week) {
      // Ensure `isDropped` is computed only once
      const weekCopy = { ...week }
      if (weekCopy.isDropped === undefined) {
        weekCopy.isDropped = getDropped(id, 'week')
      }

      const nodeweekSet = weekCopy.nodeweekSet

      // Get column order based on workflow columns
      const columnOrder = columnWorkflows
        .filter((cw) => workflow.columnworkflowSet.includes(cw.id))
        .map((cw) => cw.column)

      // Initialize nodes by column
      const nodesByColumn: Record<number, number[]> = {}
      columnOrder.forEach((columnId) => {
        nodesByColumn[columnId] = []
      })

      // Populate nodes by column using memoized `getNodeWeekByID` and `getNodeByID`
      nodeweekSet.forEach((nodeWeekId) => {
        const nodeWeek = getNodeWeekById(
          { nodeweek: nodeweeks },
          nodeWeekId
        )?.data
        const node = nodeWeek
          ? getNodeById({ node: nodeweeks }, nodeWeek.node)?.data
          : null

        if (node) {
          const columnId = node.column ?? columnOrder[0] // Fallback to the first column if undefined
          nodesByColumn[columnId].push(nodeWeekId)
        }
      })

      return {
        data: weekCopy,
        columnOrder,
        nodesByColumn,
        nodeweeks
      }
    }

    Utility.logger('no term found with id', id)
    return null
  }
)
