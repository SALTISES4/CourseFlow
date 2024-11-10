/*******************************************************
 * HELPER FUNCTIONS FOR FOR STATE QUERIES
 *******************************************************/
import * as Constants from '@cf/utility/constants'
import ThemeHelper from "@cf/utility/ThemeHelper.class";
import Utility from '@cf/utility/Utility.class'

export const getDropped = (objectId: number, objectType, depth = 1) => {
  const defaultDrop = Constants.getDefaultDropState(objectId, objectType, depth)
  try {
    const storedDrop = JSON.parse(
      window.localStorage.getItem(objectType + objectId)
    )
    if (storedDrop === null) {
      return defaultDrop
    }
    return storedDrop
  } catch (err) {
    return defaultDrop
  }
}

// @todo doesn't really belong here (not a state selector)
export const getTableOutcomeNodeByID = (outcomeNodes, nodeId, outcomeId) => {
  for (const i in outcomeNodes) {
    const outcomeNode = outcomeNodes[i]
    if (outcomeNode.outcome === outcomeId && outcomeNode.node === nodeId) {
      return { data: outcomeNode }
    }
  }
  return { data: null }
}

/**
 *  // @todo doesn't really belong here (not a state selector)
 * //Categorizes the outcomes based on their sets, if sets appropriate to that outcome type exist. Also ensures that hidden outcomes are hidden.
 * @param outcomesUnsorted
 * @param outcomeworkflowsUnsorted
 * @param outcomeworkflowSet
 * @param objectSetsUnfiltered
 */
export const getSortedOutcomeIDFromOutcomeWorkflowSet = (
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
    (objectset) => objectset.term === updatedOutcomes[0].type
  )

  // If no objectSets match, return the outcomes with the base title
  if (objectSets.length === 0) {
    return [
      {
        objectset: { title: baseTitle },
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
        objectset: { title: _t('Uncategorized') },
        outcomes: uncategorized
      }
    ]
  }

  // Add categorized outcomes
  categories = [
    ...categories,
    ...objectSets
      .filter((objectset) => !objectset.hidden)
      .map((objectset) => ({
        objectset: objectset,
        outcomes: updatedOutcomes
          .filter((outcome) => outcome.sets.indexOf(objectset.id) >= 0)
          .map((outcome) => outcome.id)
      }))
  ]

  Utility.logger('getSortedOutcomeIDFromOutcomeWorkflowSet categories')
  Utility.logger(categories)

  // Return the final categories
  return categories
}
