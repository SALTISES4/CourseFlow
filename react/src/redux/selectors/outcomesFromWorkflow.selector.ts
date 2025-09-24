import ThemeHelper from '@cf/utility/ThemeHelper.class'
import Utility, { _t } from '@cf/utility/Utility.class'
import { AppState, TOutcome } from '@cfRedux/types/type'
import { createSelector } from 'reselect'

// Base selectors
const selectOutcomeWorkflow = (state: AppState) => state.outcomeworkflow
const selectOutcome = (state: AppState) => state.outcome
const selectObjectSet = (state: AppState) => state.objectSet

// Selector for filtering and sorting outcome workflows
export const selectOutcomesFromWorkflows = createSelector(
  [
    selectOutcomeWorkflow,
    selectOutcome,
    selectObjectSet,
    (_, outcomeworkflowSet: number[]) => outcomeworkflowSet
  ],
  (outcomeworkflows, outcomes, objectSets, outcomeworkflowSet) => {
    // Filter and sort outcome workflows
    const sortedOutcomeWorkflows = Utility.filterThenSortById(
      outcomeworkflows,
      outcomeworkflowSet
    )

    // Extract outcome IDs from sorted outcome workflows
    const outcomeIds = sortedOutcomeWorkflows.map(
      (workflow) => workflow.outcome
    )

    // Filter and sort outcomes based on the extracted IDs
    const sortedOutcomes = Utility.filterThenSortById<TOutcome>(
      outcomes,
      outcomeIds
    )

    if (sortedOutcomes.length === 0) {
      return sortedOutcomes
    }

    // Map the outcomes with additional properties
    const updatedOutcomes = sortedOutcomes.map((outcome, index) => ({
      ...outcome,
      outcomeworkflow: sortedOutcomeWorkflows[index].id,
      throughNoDrag: sortedOutcomeWorkflows[index].noDrag
    }))

    const baseTitle = ThemeHelper.capWords(_t('outcomes'))

    // Filter object sets by the type of the first updated outcome
    const filteredObjectSets = objectSets.filter(
      (objectSet) => objectSet.term === updatedOutcomes[0].type
    )

    if (filteredObjectSets.length === 0) {
      return [
        {
          objectSet: {
            title: baseTitle
          },
          outcomes: updatedOutcomes
        }
      ]
    }

    // Separate uncategorized outcomes
    const uncategorized = updatedOutcomes.filter(
      (outcome) => outcome.sets.length === 0
    )

    let categories = []

    if (uncategorized.length > 0) {
      categories.push({
        objectSet: { title: _t('Uncategorized') },
        outcomes: uncategorized
      })
    }

    // Build categorized outcomes
    categories = [
      ...categories,
      ...filteredObjectSets
        .filter((objectSet) => !objectSet.hidden)
        .map((objectSet) => ({
          objectSet,
          outcomes: updatedOutcomes.filter((outcome) =>
            outcome.sets.includes(objectSet.id)
          )
        }))
    ]

    Utility.logger('categories')
    Utility.logger(categories)

    return categories
  }
)
