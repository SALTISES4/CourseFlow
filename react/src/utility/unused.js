/**
 * THIS IS NOT BEING USED
 * Used in the table. Creates a shaped tree-like structure
 * for an outcome and its children that includes each one's
 * relationship to each node.
 *
 * @param props
 * @param outcome_id
 * @param nodecategory
 * @returns {{outcomenodes: *[], children: *[], id}|null}
 */
// export function createOutcomeBranch(state, outcome_id) {
//   for (let i = 0; i < state.outcome.length; i++) {
//     if (state.outcome[i].id === outcome_id) {
//       let children
//       if (
//         state.outcome[i].child_outcome_links.length === 0 ||
//         state.outcome[i].depth >= 2
//       )
//         children = []
//       else
//         children = filterThenSortByID(
//           state.outcomeoutcome,
//           state.outcome[i].child_outcome_links
//         ).map((outcomeoutcome) =>
//           createOutcomeBranch(state, outcomeoutcome.child)
//         )
//
//       return { id: outcome_id, children: children }
//     }
//   }
//   return null
// }

/**
 * THIS IS NOT BEING USED
 * From the state, creates a tree structure for an outcome
 * @param state
 * @returns {*[]}
 */
// export function createOutcomeTree(state) {
//   const outcomes_tree = []
//   const sorted_outcomes = getSortedOutcomesFromOutcomeWorkflowSet(
//     state,
//     state.workflow.outcomeworkflow_set
//   )
//   for (let i = 0; i < sorted_outcomes.length; i++) {
//     const outcomes_tree_category = []
//     for (let j = 0; j < sorted_outcomes[i].outcomes.length; j++)
//       outcomes_tree_category.push(
//         createOutcomeBranch(state, sorted_outcomes[i].outcomes[j].id)
//       )
//     outcomes_tree.push({
//       title: sorted_outcomes[i].objectset.title,
//       outcomes: outcomes_tree_category
//     })
//   }
//   return outcomes_tree
// }

/*From a tree structure of outcomes, flatten the tree*/
// export function flattenOutcomeTree(outcomes_tree, array) {
//   outcomes_tree.forEach((element) => {
//     array.push(element.id)
//     flattenOutcomeTree(element.children, array)
//   })
// }

// export function download(filename, text) {
//   var pom = document.createElement('a')
//   pom.setAttribute(
//     'href',
//     'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
//   )
//   pom.setAttribute('download', filename)
//
//   if (document.createEvent) {
//     var event = document.createEvent('MouseEvents')
//     event.initEvent('click', true, true)
//     pom.dispatchEvent(event)
//   } else {
//     pom.click()
//   }
// }
