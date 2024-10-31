// @ts-nocheck
import * as Utility from '@cf/utility/utilityFunctions'
import { _t } from '@cf/utility/utilityFunctions'
import {
  AppState,
  TColumn,
  TColumnworkflow,
  TNode,
  TNodelink,
  TObjectSet,
  TOutcome,
  TOutcomeOutcome,
  TWeek,
  TWeekworkflow
} from '@cfRedux/types/type'

import * as Constants from '../constants'
/*******************************************************
 *
 *  This file contains selectors to encapsulate accessing the
 *  Redux state directly
 *
 *******************************************************/

/*******************************************************
 * COLUMN
 *******************************************************/
export type TGetColumnByID = {
  data: TColumn
  sibling_count: number
  columnworkflows: Pick<AppState['workflow'], 'columnworkflowSet'>
  column_order: Pick<AppState['workflow'], 'columnworkflowSet'>
}

export const getColumnById = (state: AppState, id: number): TGetColumnByID => {
  for (const i in state.column) {
    const column = state.column[i]
    if (column.id == id) {
      return {
        data: column,
        sibling_count: state.workflow.columnworkflowSet.length,
        columnworkflows: state.workflow.columnworkflowSet,
        column_order: state.workflow.columnworkflowSet.map(
          (columnworkflowId) =>
            getColumnWorkflowByID(state, columnworkflowId).data.column
        )
      }
    }
  }
  console.log('no column found with id', id)
}

/*******************************************************
 * WEEK
 *******************************************************/
export type TGetWeekByIDType = {
  data: any
  column_order: any
  sibling_count?: any
  nodeweeks: any
  workflowId?: any
}

export const getWeekById = (state: AppState, id: number): TGetWeekByIDType => {
  for (const i in state.week) {
    const week = { ...state.week[i] } // create a shallow copy to avoid mutations
    if (week.id === id) {
      if (week.isDropped === undefined) {
        // Optionally handle this scenario through dispatching an action instead
        // consider moving this logic to a reducer
        week.isDropped = getDropped(id, 'week')
      }
      return {
        data: week,
        column_order: state.workflow.columnworkflowSet.map(
          (columnworkflowId) =>
            getColumnWorkflowByID(state, columnworkflowId).data.column
        ),
        sibling_count: state.workflow.weekworkflowSet.length,
        nodeweeks: state.nodeweek,
        workflowId: state.workflow.id
      }
    }
  }
  console.log('no week found with id', id)
}

/*******************************************************
 * TERM
 *******************************************************/
export type TTermByID = {
  data: any
  column_order: any
  nodes_by_column: any
  nodeweeks: any
}
export const getTermById = (state: AppState, id: number): TTermByID => {
  for (const i in state.week) {
    const week = state.week[i]
    if (week.id == id) {
      if (week.isDropped === undefined) {
        week.isDropped = getDropped(id, 'week')
      }

      const nodeweeks = week.nodeweekSet

      const column_order = Utility.filterThenSortByID<TWeek['nodeweekSet']>(
        state.columnworkflow,
        state.workflow.columnworkflowSet
      ).map((columnworkflow) => columnworkflow.column)

      const nodes_by_column = {}
      for (var j = 0; j < column_order.length; j++) {
        nodes_by_column[column_order[j]] = []
      }
      for (var j = 0; j < nodeweeks.length; j++) {
        const node_week = getNodeWeekByID(state, nodeweeks[j]).data
        const node = getNodeByID(state, node_week.node).data
        if (node.column) nodes_by_column[node.column].push(nodeweeks[j])
        else nodes_by_column[nodes_by_column.keys()[0]].push(nodeweeks[j])
      }
      return {
        data: week,
        column_order: column_order,
        nodes_by_column: nodes_by_column,
        nodeweeks: state.nodeweek
      }
    }
  }
}

// export const getParentWorkflowByID = (state, id) => {
//   for (const i in state.parentWorkflow) {
//     const workflow = state.parentWorkflow[i]
//     if (workflow.id == id) return { data: workflow }
//   }
//   console.log('failed to find parent workflow')
// }

/*******************************************************
 * NODE
 *******************************************************/
export type TGetNodeById = {
  data: TNode
  column: any
  objectSets: any
}
export const getNodeByID = (state: AppState, id: number): TGetNodeById => {
  for (const i in state.node) {
    const node = { ...state.node[i] } // Shallow copy to avoid mutations
    if (node.id === id) {
      if (node.isDropped === undefined) {
        node.isDropped = getDropped(id, 'node') // Consider moving this to a reducer
      }
      return {
        data: node,
        column: state.column.find((column) => column.id === node.column),
        objectSets: state.objectset
      }
    }
  }
  console.log('failed to find node')
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

export const getOutcomeByID = (
  state: AppState,
  id: number
): TGetOutcomeByID => {
  const stateSection = state.outcome

  for (const i in stateSection) {
    const outcome = stateSection[i]

    if (outcome.id !== id) continue

    // Create a shallow copy to avoid mutation
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

      rank = rootInfo.rank.map(() => null) // Fill rank with null values
      titles = [...rank]

      stateSection.forEach((sectionItem) => {
        if (sectionItem.id === rootInfo.id) rootOutcome = sectionItem

        rootInfo.rank.forEach((rankItem, k) => {
          if (rankItem.parent !== sectionItem.id) return

          titles[k] = sectionItem.title
          if (!rank[k]) {
            if (sectionItem.code) {
              if (k > 0) rank[k - 1] = sectionItem.code
              else topRank = sectionItem.code
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

    // Create hovertext and prefix
    const hovertext = rank
      .map((rankItem, i) => `${rankItem}. ${titles[i]}`)
      .join(' -> ')
    const prefix = rank.join('.')

    // Return the final result without mutating the original state
    return {
      data: updatedOutcome,
      hovertext: hovertext,
      prefix: prefix,
      objectSets: state.objectset,
      workflowId: state.workflow.id
    }
  }

  console.log('Outcome not found for ID:', id)
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
 * WORKFLOW RELATIONS: WEEK-WORKFLOW
 *******************************************************/
export type TGetWeekWorkflowById = {
  data: TWeekworkflow
  order: number[]
}
export const getWeekWorkflowByID = (
  state: AppState,
  id: number
): TGetWeekWorkflowById => {
  for (const i in state.weekworkflow) {
    const weekworkflow = state.weekworkflow[i]
    if (weekworkflow.id == id)
      return { data: weekworkflow, order: state.workflow.weekworkflowSet }
  }
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
    if (outcomeworkflow.id == id)
      return {
        data: outcomeworkflow,
        order: state.workflow.outcomeworkflowSet
      }
  }
  console.log('no outcomeworkflow found with id', id)
}

/*******************************************************
 * WORKFLOW RELATIONS: COLUMN-WORKFLOW
 *******************************************************/
export type TColumnWorkflowById = {
  data?: TColumnworkflow
  order?: number[]
}

export const getColumnWorkflowByID = (
  state: AppState,
  id: number
): TColumnWorkflowById => {
  for (const i in state.columnworkflow) {
    const columnWorkflow = state.columnworkflow[i]
    if (columnWorkflow.id === id) {
      return {
        data: columnWorkflow,
        order: state.workflow.columnworkflowSet
      }
    }
  }

  console.log('no columnWorkflow found with id', id)

  return {
    data: undefined,
    order: undefined
  }
}

/*******************************************************
 * NODE RELATIONS: NODE-WEEK
 *******************************************************/
export type TGetNodeWeekById = {
  data: any
  order: any
  column: any
}
export const getNodeWeekByID = (
  state: AppState,
  id: number
): TGetNodeWeekById => {
  for (const i in state.nodeweek) {
    const nodeweek = state.nodeweek[i]
    if (nodeweek.id === id) {
      const node = getNodeByID(state, nodeweek.node).data
      return {
        data: nodeweek,
        order: getWeekById(state, nodeweek.week).nodeweekSet,
        column: node.column
      }
    }
  }
  console.log('no nodeweek found with id', id)
}

/*******************************************************
 * NODE RELATIONS:  NODE-LINK
 *******************************************************/
export type TGetNodeLinkById = {
  data: TNodelink
}
export const getNodeLinkByID = (
  state: AppState,
  id: number
): TGetNodeLinkById => {
  for (const i in state.nodelink) {
    const nodelink = state.nodelink[i]
    if (nodelink.id === id) {
      return { data: nodelink }
    }
  }
  console.log('no nodelink found with id', id)
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
      for (let k = 0; k < state.child_workflow.length; k++) {
        const index = state.child_workflow[k].outcomeworkflowSet.indexOf(
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
  for (const i in state.child_workflow) {
    const workflow = state.child_workflow[i]
    if (workflow.id === id) return { data: workflow }
  }
  console.log('failed to find child workflow')
  return -1
}

export type TOutcomeOutcomeByID = {
  data?: TOutcomeOutcome
}

export const getOutcomeOutcomeById = (
  state: AppState,
  id: number
): TOutcomeOutcomeByID => {
  const state_section = state.outcomeoutcome
  for (const i in state_section) {
    const outcomeOutcome = state_section[i]
    if (outcomeOutcome.id === id) {
      return {
        data: outcomeOutcome
      }
    }
  }
  console.log('failed to find outcomeoutcome')
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
  console.log('Failed to find outcomenode with ID:', id)
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
  console.log('failed to find outcomehorizontallink')
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
  const outcomenodes = Utility.filterThenSortByID(
    state.outcomenode,
    outcomenodeIds
  )
  const outcomes = Utility.filterThenSortByID(
    state.outcome,
    outcomenodes.map((outcomenode) => outcomenode.outcome)
  ).map((outcome, i) => ({ ...outcome, degree: outcomenodes[i].degree }))

  if (outcomes.length === 0) {
    return outcomes
  }

  const base_title = Utility.capWords(_t('outcomes'))
  const objectSets = state.objectset.filter(
    (objectset) => objectset.term === outcomes[0].type
  )
  if (objectSets.length === 0)
    return [
      {
        objectset: {
          title: base_title
        },
        outcomes: outcomes
      }
    ]
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
  console.log('returm from getSortedOutcomeNodesFromNodes')
  console.log(categories)
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
  const outcomeworkflows = Utility.filterThenSortByID(
    state.outcomeworkflow,
    outcomeworkflowSet
  )

  const outcome_ids = outcomeworkflows.map(
    (outcomeworkflow) => outcomeworkflow.outcome
  )

  // @todo clean up
  const outcomes = Utility.filterThenSortByID<TOutcome>(
    state.outcome,
    outcome_ids
  )

  if (outcomes.length === 0) {
    return outcomes
  }

  // Create a new array of outcomes to avoid mutating the state
  const updatedOutcomes = outcomes.map((outcome, index) => ({
    ...outcome, // Shallow copy of each outcome
    outcomeworkflow: outcomeworkflows[index].id,
    through_noDrag: outcomeworkflows[index].noDrag
  }))

  const base_title = Utility.capWords(_t('outcomes'))

  const objectSets = state.objectset.filter(
    (objectset) => objectset.term === updatedOutcomes[0].type
  )

  if (objectSets.length === 0) {
    return [
      {
        objectset: {
          title: base_title
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

  console.log('categories')
  console.log(categories)

  return categories
}

//Used in the Alignment View
// returns nothing
// export const getDescendantOutcomes = (state, outcome, outcomes) => {
//   if (outcome.depth >= 2) return
//   const children = outcome.childOutcomeLinks
//     .map((id) => getOutcomeOutcomeByID(state, id))
//     .map(
//       (outcomeoutcome) => getOutcomeByID(state, outcomeoutcome.data.child).data
//     )
//   for (let i = 0; i < children.length; i++) {
//     outcomes.push(children[i].id)
//     getDescendantOutcomes(state, children[i], outcomes)
//   }
// }
/*******************************************************
 * HELPER FUNCTIONS FOR FOR STATE QUERIES
 *******************************************************/

const getDropped = (objectId: number, objectType, depth = 1) => {
  const default_drop = Constants.getDefaultDropState(
    objectId,
    objectType,
    depth
  )
  try {
    const storedDrop = JSON.parse(
      window.localStorage.getItem(objectType + objectId)
    )
    if (storedDrop === null) return default_drop
    return storedDrop
  } catch (err) {
    return default_drop
  }
}

// @todo doesn't really belong here (not a state selector)
export const getTableOutcomeNodeByID = (outcomeNodes, nodeId, outcomeId) => {
  for (const i in outcomeNodes) {
    const outcomeNode = outcomeNodes[i]
    if (outcomeNode.outcome === outcomeId && outcomeNode.node === nodeId)
      return { data: outcomeNode }
  }
  return { data: null }
}

/**
 *  // @todo doesn't really belong here (not a state selector)
 * //Categorizes the outcomes based on their sets, if sets appropriate to that outcome type exist. Also ensures that hidden outcomes are hidden.
 * @param outcomes_unsorted
 * @param outcomeworkflows_unsorted
 * @param outcomeworkflowSet
 * @param objectSets_unfiltered
 */
export const getSortedOutcomeIDFromOutcomeWorkflowSet = (
  outcomes_unsorted,
  outcomeworkflows_unsorted,
  outcomeworkflowSet,
  objectSets_unfiltered
) => {
  // Get sorted outcome workflows based on the provided IDs
  const outcomeworkflows = Utility.filterThenSortByID(
    outcomeworkflows_unsorted,
    outcomeworkflowSet
  )

  // Extract the outcome IDs from the sorted outcome workflows
  const outcome_ids = outcomeworkflows.map(
    (outcomeworkflow) => outcomeworkflow.outcome
  )

  // Filter and sort the outcomes based on the outcome IDs
  const outcomes = Utility.filterThenSortByID(outcomes_unsorted, outcome_ids)

  // Create a new array to avoid mutating the original outcomes
  const updatedOutcomes = outcomes.map((outcome, index) => ({
    ...outcome, // Shallow copy of each outcome
    outcomeworkflow: outcomeworkflows[index].id,
    through_noDrag: outcomeworkflows[index].noDrag
  }))

  // If there are no outcomes, return their IDs
  if (updatedOutcomes.length === 0) {
    return updatedOutcomes.map((outcome) => outcome.id)
  }

  // Prepare the base title for uncategorized outcomes
  const base_title = Utility.capWords(_t('outcomes'))

  // Filter the objectSets to match the first outcome's type
  const objectSets = objectSets_unfiltered.filter(
    (objectset) => objectset.term === updatedOutcomes[0].type
  )

  // If no objectSets match, return the outcomes with the base title
  if (objectSets.length === 0) {
    return [
      {
        objectset: { title: base_title },
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

  console.log('getSortedOutcomeIDFromOutcomeWorkflowSet categories')
  console.log(categories)

  // Return the final categories
  return categories
}
