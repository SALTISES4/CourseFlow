import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import Utility, { _t } from '@cf/utility/Utility.class'
import { getDropped } from '@cfRedux/selectors/helpers'
import {
  AppState,
  TColumnworkflow,
  TComment,
  TObjectSet,
  TOutcome,
  TOutcomeOutcome,
  TWeekworkflow
} from '@cfRedux/types/type'

// stubs
export const getWeekById = () => {
  // must go
}
export const getNodeById = () => {
  // must go
}
export const getWeekWorkflowByID = () => {
  // must go
}

export const getColumnWorkflowByID = () => {
  // to go...
}

/*******************************************************
 * DELETE ME
 *******************************************************/
export type TColumnWorkflowById = {
  data?: TColumnworkflow
  order?: number[]
}

export type TGetWeekWorkflowById = {
  data: TWeekworkflow
  order: number[]
}
export type TTermByID = {
  data: any
  columnOrder: any
  nodesByColumn: any
  nodeweeks: any
}

/*******************************************************
 *  @todo these items are largely not useful and need to
 *  be moved to a proper selector pattern with memoization
 *
 *
 *  This file contains selectors to encapsulate accessing the
 *  Redux state directly
 *
 *******************************************************/

/*******************************************************
 * COLUMN
 *******************************************************/

export type TGetComments = TComment[]

export const getComments = ({
  objectId,
  objectType,
  state
}: {
  objectId: number
  objectType: CfObjectType
  state: AppState
}): TGetComments => {
  if (objectType === CfObjectType.NODE) {
    return state.node.find((item) => item.id === objectId).comments
  }

  return []
  Utility.logger('no column found with id', id)
}

/*******************************************************
 * OUTCOME
 *******************************************************/
export type TGetOutcomeByID = {
  data: TOutcome
  hovertext: string
  prefix: string
  objectSets: TObjectSet
  workflowId: number
}

// lol no
export const getOutcomeByID = (
  state: AppState,
  id: number
): TGetOutcomeByID => {
  const stateSection = state.outcome

  for (const i in stateSection) {
    const outcome = stateSection[i]

    if (outcome.id !== id) {
      continue
    }

    const updatedOutcome = { ...outcome }

    // Ensure isDropped is set without mutating state
    if (updatedOutcome.isDropped === undefined) {
      updatedOutcome.isDropped = getDropped(id, 'outcome', updatedOutcome.depth)
    }

    let rootOutcome = updatedOutcome
    let rank = []
    let titles = []
    let topRank = updatedOutcome.code || null

    // Handle if the depth is greater than 0 (requires ranking logic)
    if (updatedOutcome.depth > 0) {
      const stateOutcomeSection = state.outcomeoutcome
      const rootInfo = findRootOutcome(
        stateOutcomeSection,
        updatedOutcome.id,
        []
      )

      rank = rootInfo.rank.map(() => null)
      titles = [...rank]

      stateSection.forEach((sectionItem) => {
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
      topRank = topRank || findTopRank(state, rootOutcome)
    }

    titles.push(updatedOutcome.title)
    rank.unshift(topRank)

    const hovertext = rank
      .map((rankItem, i) => `${rankItem}. ${titles[i]}`)
      .join(' -> ')
    const prefix = rank.join('.')

    return {
      data: updatedOutcome,
      hovertext: hovertext,
      prefix: prefix,
      objectSets: state.objectset,
      workflowId: state.workflow.id
    }
  }

  Utility.logger('Outcome not found for ID:', id)
}

/*******************************************************
 * STRATEGY
 *******************************************************/
export type TStrategyByID = {
  data: any // don't have type for strategy
}
export const getStrategyById = (state: AppState, id: number): TStrategyByID => {
  const strategies = Object.values(state.strategy)
  const foundStrategy = strategies.find((strategy) => strategy.id === id)
  return foundStrategy ? { data: foundStrategy } : { data: undefined }
}

/*******************************************************
 * WORKFLOW RELATIONS: OUTCOME-WORKFLOW
 *******************************************************/
export type TGetOutcomeWorkflowByID = {
  data: any
  order: any
}
export const getOutcomeWorkflowByID = (
  state: AppState,
  id: number
): TGetOutcomeWorkflowByID => {
  for (const i in state.outcomeworkflow) {
    const outcomeworkflow = state.outcomeworkflow[i]
    if (outcomeworkflow.id == id) {
      return {
        data: outcomeworkflow,
        order: state.workflow.outcomeworkflowSet
      }
    }
  }
  Utility.logger('no outcomeworkflow found with id', id)
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
function findRootOutcome(
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

function findTopRank(state: AppState, outcome) {
  for (let j = 0; j < state.outcomeworkflow.length; j++) {
    if (state.outcomeworkflow[j].outcome === outcome.id) {
      if (state.outcomeworkflow[j].workflow === state.workflow.id) {
        return (
          state.workflow.outcomeworkflowSet.indexOf(
            state.outcomeworkflow[j].id
          ) + 1
        )
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

export const getChildWorkflowById = (state: AppState, id: number) => {
  for (const i in state.childWorkflow) {
    const workflow = state.childWorkflow[i]
    if (workflow.id === id) {
      return { data: workflow }
    }
  }
  Utility.logger('failed to find child workflow')
  return -1
}

export type TOutcomeOutcomeByID = {
  data?: TOutcomeOutcome
}

export const getOutcomeOutcomeById = (
  state: AppState,
  id: number
): TOutcomeOutcomeByID => {
  const stateSection = state.outcomeoutcome
  for (const i in stateSection) {
    const outcomeOutcome = stateSection[i]
    if (outcomeOutcome.id === id) {
      return {
        data: outcomeOutcome
      }
    }
  }
  Utility.logger('failed to find outcomeoutcome')
}

export type TOutcomeNodeByID = {
  data: TOutcomeNode
}

export const getOutcomeNodeByID = (
  state: AppState,
  id: number
): TOutcomeNodeByID => {
  const outcomeNode = state.outcomenode.find((node) => node.id === id)
  if (outcomeNode) {
    return {
      data: outcomeNode
    }
  }
  Utility.logger('Failed to find outcomenode with ID:', id)
}

export type TOutcomeHorizontalLinkByID = {
  data: any
}

export const getOutcomeHorizontalLinkByID = (
  state: AppState,
  id: number
): TOutcomeHorizontalLinkByID => {
  for (const i in state.outcomehorizontallink) {
    const outcomeHorizontalLink = state.outcomehorizontallink[i]
    if (outcomeHorizontalLink.id == id) {
      return {
        data: outcomeHorizontalLink
      }
    }
  }
  Utility.logger('failed to find outcomehorizontallink')
}

export type TOutcomeWithDegree = TOutcome & { degree: number }

export type TSortedOutcomeNodes = {
  objectset: TObjectSet
  outcomes: TOutcomeWithDegree[]
}[]

export const getSortedOutcomeNodesFromNodes = (
  state: AppState,
  nodes
): TSortedOutcomeNodes => {
  let outcomenodeIds = []
  for (let i = 0; i < nodes.length; i++) {
    outcomenodeIds = outcomenodeIds.concat(nodes[i].outcomenodeUniqueSet)
  }
  const outcomenodes = Utility.filterThenSortById(
    state.outcomenode,
    outcomenodeIds
  )
  const outcomes = Utility.filterThenSortById(
    state.outcome,
    outcomenodes.map((outcomenode) => outcomenode.outcome)
  ).map((outcome, i) => ({ ...outcome, degree: outcomenodes[i].degree }))

  if (outcomes.length === 0) {
    return outcomes
  }

  const baseTitle = ThemeHelper.capWords(_t('outcomes'))
  const objectSets = state.objectset.filter(
    (objectset) => objectset.term === outcomes[0].type
  )
  if (objectSets.length === 0) {
    return [
      {
        objectset: {
          title: baseTitle
        },
        outcomes: outcomes
      }
    ]
  }
  const categories = [
    {
      objectset: { title: _t('Uncategorized') },
      outcomes: outcomes.filter((outcome) => outcome.sets.length === 0)
    },
    ...objectSets
      .filter((objectset) => !objectset.hidden)
      .map((objectset) => ({
        objectset: objectset,
        outcomes: outcomes.filter(
          (outcome) => outcome.sets.indexOf(objectset.id) >= 0
        )
      }))
  ]
  Utility.logger('returm from getSortedOutcomeNodesFromNodes')
  Utility.logger(categories)
  return categories
}

export type TSortedOutcomes = {
  objectset: TObjectSet
  outcomes: TOutcome[]
}[]

/**
 * Categorizes the outcomes based on their sets, if sets appropriate to that outcome type exist. Also ensures that hidden outcomes are hidden.
 * @param state
 * @param outcomeworkflowSet
 */
export const getSortedOutcomesFromOutcomeWorkflowSet = (
  state: AppState,
  outcomeworkflowSet: number[]
): TSortedOutcomes => {
  const outcomeworkflows = Utility.filterThenSortById(
    state.outcomeworkflow,
    outcomeworkflowSet
  )

  const outcomeIds = outcomeworkflows.map(
    (outcomeworkflow) => outcomeworkflow.outcome
  )

  // @todo clean up
  const outcomes = Utility.filterThenSortById<TOutcome>(
    state.outcome,
    outcomeIds
  )

  if (outcomes.length === 0) {
    return outcomes
  }

  // Create a new array of outcomes to avoid mutating the state
  const updatedOutcomes = outcomes.map((outcome, index) => ({
    ...outcome, // Shallow copy of each outcome
    outcomeworkflow: outcomeworkflows[index].id,
    throughNoDrag: outcomeworkflows[index].noDrag
  }))

  const baseTitle = ThemeHelper.capWords(_t('outcomes'))

  const objectSets = state.objectset.filter(
    (objectset) => objectset.term === updatedOutcomes[0].type
  )

  if (objectSets.length === 0) {
    return [
      {
        objectset: {
          title: baseTitle
        },
        outcomes: updatedOutcomes
      }
    ]
  }

  const uncategorized = updatedOutcomes.filter(
    (outcome) => outcome.sets.length === 0
  )

  let categories = []
  if (uncategorized.length > 0) {
    categories = [
      {
        objectset: { title: _t('Uncategorized') },
        outcomes: uncategorized
      }
    ]
  }

  categories = [
    ...categories,
    ...objectSets
      .filter((objectset) => !objectset.hidden)
      .map((objectset) => ({
        objectset: objectset,
        outcomes: updatedOutcomes.filter(
          (outcome) => outcome.sets.indexOf(objectset.id) >= 0
        )
      }))
  ]

  Utility.logger('categories')
  Utility.logger(categories)

  return categories
}
