/*******************************************************
 * HELPER FUNCTIONS FOR FOR STATE QUERIES
 *******************************************************/
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import Utility, { _t } from '@cf/utility/Utility.class'
import { AppState } from '@cfRedux/types/type'

// @todo doesn't really belong here (not a state selector)
export const getTableOutcomeNodeById = (outcomeNodes, nodeId, outcomeId) => {
  for (const i in outcomeNodes) {
    const outcomeNode = outcomeNodes[i]
    if (outcomeNode.outcome === outcomeId && outcomeNode.node === nodeId) {
      return { data: outcomeNode }
    }
  }
  return { data: null }
}

/**
 *
 * Categorizes the outcomes based on their sets, if sets appropriate to that outcome type exist. Also ensures that hidden outcomes are hidden.
 * @param outcomesUnsorted
 * @param outcomeworkflowsUnsorted
 * @param outcomeworkflowSet
 * @param objectSetsUnfiltered
 */

// @todo needs typing
export const getOutcomeIdFromWorkflow = (
  outcomesUnsorted,
  outcomeworkflowsUnsorted,
  outcomeworkflowSet,
  objectSetsUnfiltered
) => {
  // Get sorted outcome workflows based on the provided IDs
  const outcomeworkflows = Utility.filterThenSortById(
    outcomeworkflowsUnsorted,
    outcomeworkflowSet
  )

  // Extract the outcome IDs from the sorted outcome workflows
  const outcomeIds = outcomeworkflows.map(
    (outcomeworkflow) => outcomeworkflow.outcome
  )

  // Filter and sort the outcomes based on the outcome IDs
  const outcomes = Utility.filterThenSortById(outcomesUnsorted, outcomeIds)

  // Create a new array to avoid mutating the original outcomes
  const updatedOutcomes = outcomes.map((outcome, index) => ({
    ...outcome, // Shallow copy of each outcome
    outcomeworkflow: outcomeworkflows[index].id,
    throughNoDrag: outcomeworkflows[index].noDrag
  }))

  // If there are no outcomes, return their IDs
  if (updatedOutcomes.length === 0) {
    return updatedOutcomes.map((outcome) => outcome.id)
  }

  // Prepare the base title for uncategorized outcomes
  const baseTitle = ThemeHelper.capWords(_t('outcomes'))

  // Filter the objectSets to match the first outcome's type
  const objectSets = objectSetsUnfiltered.filter(
    (objectSet) => objectSet.term === updatedOutcomes[0].type
  )

  // If no objectSets match, return the outcomes with the base title
  if (objectSets.length === 0) {
    return [
      {
        objectSet: { title: baseTitle },
        outcomes: updatedOutcomes.map((outcome) => outcome.id)
      }
    ]
  }

  // Separate uncategorized outcomes (those without sets)
  const uncategorized = updatedOutcomes
    .filter((outcome) => outcome.sets.length === 0)
    .map((outcome) => outcome.id)

  // Initialize categories
  let categories = []
  if (uncategorized.length > 0) {
    categories = [
      {
        objectSet: { title: _t('Uncategorized') },
        outcomes: uncategorized
      }
    ]
  }

  // Add categorized outcomes
  categories = [
    ...categories,
    ...objectSets
      .filter((objectSet) => !objectSet.hidden)
      .map((objectSet) => ({
        objectSet: objectSet,
        outcomes: updatedOutcomes
          .filter((outcome) => outcome.sets.indexOf(objectSet.id) >= 0)
          .map((outcome) => outcome.id)
      }))
  ]

  Utility.logger('getSortedOutcomeIdFromOutcomeWorkflowSet categories')
  Utility.logger(categories)

  // Return the final categories
  return categories
}

/**
 * @todo normalize the arguments order
 * Find the root outcome, and as we go, create pairs of parent outcome ids / throughmodel ids.
 * These can later be pieced together in an iteration over the outcomes to create a list of ranks.
 *
 * @param id
 * @param rank
 * @param state
 * @returns {*|{rank: *, id: *}}
 */
export function findRootOutcome(
  state: string | any[],
  id: number,
  rank: { parent: any; through: any }[]
): any | { rank: any; id: any } {
  for (let i = 0; i < state.length; i++) {
    if (state[i].child === id) {
      rank.unshift({ parent: state[i].parent, through: state[i].id })
      return findRootOutcome(state, state[i].parent, rank)
    }
  }
  return { id: id, rank: rank }
}

export function findTopRank(state: AppState, outcome) {
  for (let j = 0; j < state.outcomeworkflow.length; j++) {
    if (state.outcomeworkflow[j].outcome === outcome.id) {
      if (state.outcomeworkflow[j].workflow === state.workflow.id) {
        return state.workflow.outcomes.indexOf(state.outcomeworkflow[j].id) + 1
      }
      for (let k = 0; k < state.childWorkflow.length; k++) {
        const index = state.childWorkflow[k].outcomeworkflowSet.indexOf(
          state.outcomeworkflow[j].id
        )
        if (index >= 0) {
          return index + 1
        }
      }
      for (let k = 0; k < state.parentWorkflow.length; k++) {
        const index = state.parentWorkflow[k].outcomeworkflowSet.indexOf(
          state.outcomeworkflow[j].id
        )
        if (index >= 0) {
          return index + 1
        }
      }
    }
  }
}

export const getNextLargestNumber = (haystack: number[]): number => {
  const lastId = haystack.reduce((acc, curr) => {
    return acc > curr ? acc : curr
  }, 0)

  return lastId + 1
}
