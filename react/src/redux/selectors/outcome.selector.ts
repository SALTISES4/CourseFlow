import Utility from '@cf/utility/Utility.class'
import {
  findRootOutcome,
  findTopRank,
  getDropped
} from '@cfRedux/selectors/helpers'
import { AppState } from '@cfRedux/types/type'
import { createSelector } from 'reselect'

const selectOutcomes = (state: AppState) => state.outcome
const selectOutcomeOutcome = (state: AppState) => state.outcomeoutcome
const selectObjectSets = (state: AppState) => state.objectSet
const selectWorkflowId = (state: AppState) => state.workspace.workflow.id
// temp
const stateProxy = (state: AppState) => state

export const selectOutcomeById = createSelector(
  [
    selectOutcomes,
    selectOutcomeOutcome,
    selectObjectSets,
    selectWorkflowId,
    (_, id: number) => id,
    stateProxy
  ],
  (outcomes, outcomeOutcomeSection, objectSets, workflowId, id, state) => {
    const outcome = outcomes.find((item) => item.id === id)

    if (!outcome) {
      Utility.logger('Outcome not found for ID:', id)
      return null
    }

    const updatedOutcome = { ...outcome }

    if (updatedOutcome.isDropped === undefined) {
      updatedOutcome.isDropped = getDropped(id, 'outcome', updatedOutcome.depth)
    }

    let rootOutcome = updatedOutcome
    let rank = []
    let titles = []
    let topRank = updatedOutcome.code || null

    if (updatedOutcome.depth > 0) {
      const rootInfo = findRootOutcome(
        outcomeOutcomeSection,
        updatedOutcome.id,
        []
      )

      rank = rootInfo.rank.map(() => null)
      titles = [...rank]

      outcomes.forEach((sectionItem) => {
        if (sectionItem.id === rootInfo.id) {
          rootOutcome = sectionItem
        }

        rootInfo.rank.forEach((rankItem, k) => {
          if (rankItem.parent !== sectionItem.id) {
            return
          }

          titles[k] = sectionItem.title

          if (!rank[k]) {
            if (sectionItem.code) {
              if (k > 0) {
                rank[k - 1] = sectionItem.code
              } else {
                topRank = sectionItem.code
              }
            }

            rank[k] =
              sectionItem.childOutcomeLinks.indexOf(rankItem.through) + 1
          }
        })
      })
    } else {
      // this kind of defeats the whole point of redux, of normalization
      topRank = topRank || findTopRank(state, rootOutcome)
    }

    titles.push(updatedOutcome.title)
    rank.unshift(topRank)

    const hovertext = rank
      .map((rankItem, i) => `${rankItem}. ${titles[i]}`)
      .join(' -> ')
    const prefix = rank.join('.')

    return {
      outcome: updatedOutcome,
      hovertext,
      prefix,
      objectSets,
      workflowId
    }
  }
)

// import {AppState} from "@cfRedux/types/type";
// import {getDropped} from "@cfRedux/selectors/helpers";
// import Utility from "@cf/utility/Utility.class";
// import {TGetOutcomeByID} from "@cfFindState";
//
// export const getOutcomeByID = (
//   state: AppState,
//   id: number
// ): TGetOutcomeByID => {
//   const stateSection = state.outcome
//
//   for (const i in stateSection) {
//     const outcome = stateSection[i]
//
//     if (outcome.id !== id) {
//       continue
//     }
//
//     const updatedOutcome = { ...outcome }
//
//     // Ensure isDropped is set without mutating state
//     if (updatedOutcome.isDropped === undefined) {
//       updatedOutcome.isDropped = getDropped(id, 'outcome', updatedOutcome.depth)
//     }
//
//     let rootOutcome = updatedOutcome
//     let rank = []
//     let titles = []
//     let topRank = updatedOutcome.code || null
//
//     // Handle if the depth is greater than 0 (requires ranking logic)
//     if (updatedOutcome.depth > 0) {
//       const stateOutcomeSection = state.outcomeoutcome
//       const rootInfo = findRootOutcome(
//         stateOutcomeSection,
//         updatedOutcome.id,
//         []
//       )
//
//       rank = rootInfo.rank.map(() => null)
//       titles = [...rank]
//
//       stateSection.forEach((sectionItem) => {
//         if (sectionItem.id === rootInfo.id) {
//           rootOutcome = sectionItem
//         }
//
//         rootInfo.rank.forEach((rankItem, k) => {
//           if (rankItem.parent !== sectionItem.id) {
//             return
//           }
//
//           titles[k] = sectionItem.title
//           if (!rank[k]) {
//             if (sectionItem.code) {
//               if (k > 0) {
//                 rank[k - 1] = sectionItem.code
//               } else {
//                 topRank = sectionItem.code
//               }
//             }
//             rank[k] =
//               sectionItem.childOutcomeLinks.indexOf(rankItem.through) + 1
//           }
//         })
//       })
//     } else {
//       topRank = topRank || findTopRank(state, rootOutcome)
//     }
//
//     titles.push(updatedOutcome.title)
//     rank.unshift(topRank)
//
//     const hovertext = rank
//       .map((rankItem, i) => `${rankItem}. ${titles[i]}`)
//       .join(' -> ')
//     const prefix = rank.join('.')
//
//     return {
//       data: updatedOutcome,
//       hovertext: hovertext,
//       prefix: prefix,
//       objectSets: state.objectSet,
//       workflowId: state.workflow.id
//     }
//   }
//
//   Utility.logger('Outcome not found for ID:', id)
// }
