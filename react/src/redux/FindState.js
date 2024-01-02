import * as Constants from '../constants'
import * as Utility from '@cfUtility'

/*******************************************************
 *
 *  This file contains selectors to encapsulate accessing the
 *  Redux state directly
 *
 *******************************************************/

export const getColumnByID = (state, id) => {
  for (var i in state.column) {
    var column = state.column[i]
    if (column.id == id)
      return {
        data: column,
        sibling_count: state.workflow.columnworkflow_set.length,
        columnworkflows: state.workflow.columnworkflow_set,
        column_order: state.workflow.columnworkflow_set.map(
          (columnworkflow_id) =>
            getColumnWorkflowByID(state, columnworkflow_id).data.column
        )
      }
  }
}

export const getColumnWorkflowByID = (state, id) => {
  for (var i in state.columnworkflow) {
    var columnworkflow = state.columnworkflow[i]
    if (columnworkflow.id == id)
      return { data: columnworkflow, order: state.workflow.columnworkflow_set }
  }
}

export const getWeekByID = (state, id) => {
  for (var i in state.week) {
    var week = state.week[i]
    if (week.id == id) {
      if (week.is_dropped === undefined) {
        week.is_dropped = getDropped(id, 'week')
      }
      return {
        data: week,
        column_order: state.workflow.columnworkflow_set.map(
          (columnworkflow_id) =>
            getColumnWorkflowByID(state, columnworkflow_id).data.column
        ),
        sibling_count: state.workflow.weekworkflow_set.length,
        nodeweeks: state.nodeweek,
        workflow_id: state.workflow.id
      }
    }
  }
}

export const getTermByID = (state, id) => {
  for (var i in state.week) {
    var week = state.week[i]
    if (week.id == id) {
      if (week.is_dropped === undefined) {
        week.is_dropped = getDropped(id, 'week')
      }
      var nodeweeks = week.nodeweek_set
      let column_order = Utility.filterThenSortByID(
        state.columnworkflow,
        state.workflow.columnworkflow_set
      ).map((columnworkflow) => columnworkflow.column)
      var nodes_by_column = {}
      for (var j = 0; j < column_order.length; j++) {
        nodes_by_column[column_order[j]] = []
      }
      for (var j = 0; j < nodeweeks.length; j++) {
        let node_week = getNodeWeekByID(state, nodeweeks[j]).data
        let node = getNodeByID(state, node_week.node).data
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

export const getWeekWorkflowByID = (state, id) => {
  for (var i in state.weekworkflow) {
    var weekworkflow = state.weekworkflow[i]
    if (weekworkflow.id == id)
      return { data: weekworkflow, order: state.workflow.weekworkflow_set }
  }
}

export const getOutcomeWorkflowByID = (state, id) => {
  for (var i in state.outcomeworkflow) {
    var outcomeworkflow = state.outcomeworkflow[i]
    if (outcomeworkflow.id == id)
      return {
        data: outcomeworkflow,
        order: state.workflow.outcomeworkflow_set
      }
  }
  console.log('failed to find outcomeworkflow')
}

export const getParentWorkflowByID = (state, id) => {
  for (var i in state.parent_workflow) {
    var workflow = state.parent_workflow[i]
    if (workflow.id == id) return { data: workflow }
  }
  console.log('failed to find parent workflow')
}

export const getNodeByID = (state, id) => {
  for (var i in state.node) {
    var node = state.node[i]
    if (node.id == id) {
      if (node.is_dropped === undefined) {
        node.is_dropped = getDropped(id, 'node')
      }
      return {
        data: node,
        column: state.column.find((column) => column.id == node.column),
        object_sets: state.objectset
      }
    }
  }
  console.log('failed to find node')
}

export const getNodeWeekByID = (state, id) => {
  for (var i in state.nodeweek) {
    var nodeweek = state.nodeweek[i]
    if (nodeweek.id == id) {
      let node = getNodeByID(state, nodeweek.node).data
      return {
        data: nodeweek,
        order: getWeekByID(state, nodeweek.week).nodeweek_set,
        column: node.column
      }
    }
  }
}
export const getNodeLinkByID = (state, id) => {
  for (var i in state.nodelink) {
    var nodelink = state.nodelink[i]
    if (nodelink.id == id) return { data: nodelink }
  }
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
function findRootOutcome(id, rank, state) {
  for (let i = 0; i < state.length; i++) {
    if (state[i].child == id) {
      rank.unshift({ parent: state[i].parent, through: state[i].id })
      return findRootOutcome(state[i].parent, rank, state)
    }
  }
  return { id: id, rank: rank }
}

function findTopRank(state, outcome) {
  for (let j = 0; j < state.outcomeworkflow.length; j++) {
    if (state.outcomeworkflow[j].outcome == outcome.id) {
      if (state.outcomeworkflow[j].workflow == state.workflow.id) {
        return (
          state.workflow.outcomeworkflow_set.indexOf(
            state.outcomeworkflow[j].id
          ) + 1
        )
      }
      for (let k = 0; k < state.child_workflow.length; k++) {
        let index = state.child_workflow[k].outcomeworkflow_set.indexOf(
          state.outcomeworkflow[j].id
        )
        if (index >= 0) {
          return index + 1
        }
      }
      for (let k = 0; k < state.parent_workflow.length; k++) {
        let index = state.parent_workflow[k].outcomeworkflow_set.indexOf(
          state.outcomeworkflow[j].id
        )
        if (index >= 0) {
          return index + 1
        }
      }
    }
  }
}

export const getOutcomeByID = (state, id) => {
  let state_section = state.outcome
  for (var i in state_section) {
    var outcome = state_section[i]

    if (outcome.id == id) {
      if (outcome.is_dropped === undefined) {
        outcome.is_dropped = getDropped(id, 'outcome', outcome.depth)
      }
      let root_outcome
      let rank = []
      let titles = []
      let top_rank
      if (outcome.depth > 0) {
        let state_outcomeoutcome_section = state.outcomeoutcome
        let root_info = findRootOutcome(
          outcome.id,
          [],
          state_outcomeoutcome_section
        )
        rank = root_info.rank.map((x) => null)
        titles = rank.map((x) => null)
        for (let j = 0; j < state_section.length; j++) {
          if (state_section[j].id == root_info.id)
            root_outcome = state_section[j]
          for (let k = 0; k < root_info.rank.length; k++) {
            if (root_info.rank[k].parent == state_section[j].id) {
              titles[k] = state_section[j].title
              if (rank[k]) continue
              if (state_section[j].code) {
                if (k > 0) rank[k - 1] = state_section[j].code
                else top_rank = state_section[j].code
              }
              rank[k] =
                state_section[j].child_outcome_links.indexOf(
                  root_info.rank[k].through
                ) + 1
            }
          }
        }
      } else {
        root_outcome = outcome
        if (outcome.code) top_rank = outcome.code
      }
      if (!top_rank) top_rank = findTopRank(state, root_outcome)
      titles.push(outcome.title)
      rank.unshift(top_rank)
      let hovertext = rank
        .map((rank_i, i) => rank_i + '. ' + titles[i])
        .join(' -> ')
      let prefix = rank.join('.')
      return {
        data: outcome,
        hovertext: hovertext,
        prefix: prefix,
        object_sets: state.objectset,
        workflow_id: state.workflow.id
      }
    }
  }
  console.log('failed to find outcome')
}

export const getChildWorkflowByID = (state, id) => {
  for (var i in state.child_workflow) {
    var workflow = state.child_workflow[i]
    if (workflow.id == id) return { data: workflow }
  }
  console.log('failed to find child workflow')
  return -1
}

export const getOutcomeOutcomeByID = (state, id) => {
  let state_section = state.outcomeoutcome
  for (var i in state_section) {
    var outcomeoutcome = state_section[i]
    if (outcomeoutcome.id == id) return { data: outcomeoutcome }
  }
  console.log('failed to find outcomeoutcome')
}

export const getOutcomeNodeByID = (state, id) => {
  for (var i in state.outcomenode) {
    var outcomenode = state.outcomenode[i]
    if (outcomenode.id == id) return { data: outcomenode }
  }
  console.log('failed to find outcomenode')
}

export const getOutcomeHorizontalLinkByID = (state, id) => {
  for (var i in state.outcomehorizontallink) {
    var outcomehorizontallink = state.outcomehorizontallink[i]
    if (outcomehorizontallink.id == id) return { data: outcomehorizontallink }
  }
  console.log('failed to find outcomehorizontallink')
}

export const getStrategyByID = (state, id) => {
  for (var i in state.strategy) {
    var strategy = state.strategy[i]
    if (strategy.id == id) return { data: strategy }
  }
}

//Categorizes the outcomes based on their sets, if sets appropriate to that outcome type exist. Also ensures that hidden outcomes are hidden.
export const getSortedOutcomesFromOutcomeWorkflowSet = (
  state,
  outcomeworkflow_set
) => {
  let outcomeworkflows = Utility.filterThenSortByID(
    state.outcomeworkflow,
    outcomeworkflow_set
  )
  let outcome_ids = outcomeworkflows.map(
    (outcomeworkflow) => outcomeworkflow.outcome
  )
  let outcomes = Utility.filterThenSortByID(state.outcome, outcome_ids)
  for (var i = 0; i < outcomes.length; i++) {
    outcomes[i].outcomeworkflow = outcomeworkflows[i].id
    outcomes[i].through_no_drag = outcomeworkflows[i].no_drag
  }
  if (outcomes.length == 0) return outcomes
  let base_title = Utility.capWords(window.gettext('outcomes'))
  let object_sets = state.objectset.filter(
    (objectset) => objectset.term == outcomes[0].type
  )
  if (object_sets.length == 0)
    return [{ objectset: { title: base_title }, outcomes: outcomes }]
  let uncategorized = outcomes.filter((outcome) => outcome.sets.length == 0)
  let categories = []
  if (uncategorized.length > 0)
    categories = [
      {
        objectset: { title: window.gettext('Uncategorized') },
        outcomes: uncategorized
      }
    ]
  categories = [
    ...categories,
    ...object_sets
      .filter((objectset) => !objectset.hidden)
      .map((objectset) => ({
        objectset: objectset,
        outcomes: outcomes.filter(
          (outcome) => outcome.sets.indexOf(objectset.id) >= 0
        )
      }))
  ]
  return categories
}

export const getSortedOutcomeNodesFromNodes = (state, nodes) => {
  let outcomenode_ids = []
  for (let i = 0; i < nodes.length; i++) {
    outcomenode_ids = outcomenode_ids.concat(nodes[i].outcomenode_unique_set)
  }
  let outcomenodes = Utility.filterThenSortByID(
    state.outcomenode,
    outcomenode_ids
  )
  let outcomes = Utility.filterThenSortByID(
    state.outcome,
    outcomenodes.map((outcomenode) => outcomenode.outcome)
  ).map((outcome, i) => ({ ...outcome, degree: outcomenodes[i].degree }))
  if (outcomes.length == 0) return outcomes
  let base_title = Utility.capWords(window.gettext('outcomes'))
  let object_sets = state.objectset.filter(
    (objectset) => objectset.term == outcomes[0].type
  )
  if (object_sets.length == 0)
    return [{ objectset: { title: base_title }, outcomes: outcomes }]
  let categories = [
    {
      objectset: { title: window.gettext('Uncategorized') },
      outcomes: outcomes.filter((outcome) => outcome.sets.length == 0)
    },
    ...object_sets
      .filter((objectset) => !objectset.hidden)
      .map((objectset) => ({
        objectset: objectset,
        outcomes: outcomes.filter(
          (outcome) => outcome.sets.indexOf(objectset.id) >= 0
        )
      }))
  ]
  return categories
}

/*******************************************************
 * HELPER
 *******************************************************/
const getDropped = (objectID, objectType, depth = 1) => {
  let default_drop = Constants.get_default_drop_state(
    objectID,
    objectType,
    depth
  )
  try {
    let stored_drop = JSON.parse(
      window.localStorage.getItem(objectType + objectID)
    )
    if (stored_drop === null) return default_drop
    return stored_drop
  } catch (err) {
    return default_drop
  }
}

// @todo doesn't really belong here (not a state selector)
export const getTableOutcomeNodeByID = (outcomenodes, node_id, outcome_id) => {
  for (var i in outcomenodes) {
    var outcomenode = outcomenodes[i]
    if (outcomenode.outcome == outcome_id && outcomenode.node == node_id)
      return { data: outcomenode }
  }
  return { data: null }
}

// @todo doesn't really belong here (not a state selector)
//Categorizes the outcomes based on their sets, if sets appropriate to that outcome type exist. Also ensures that hidden outcomes are hidden.
export const getSortedOutcomeIDFromOutcomeWorkflowSet = (
  outcomes_unsorted,
  outcomeworkflows_unsorted,
  outcomeworkflow_set,
  object_sets_unfiltered
) => {
  let outcomeworkflows = Utility.filterThenSortByID(
    outcomeworkflows_unsorted,
    outcomeworkflow_set
  )
  let outcome_ids = outcomeworkflows.map(
    (outcomeworkflow) => outcomeworkflow.outcome
  )
  let outcomes = Utility.filterThenSortByID(outcomes_unsorted, outcome_ids)
  for (var i = 0; i < outcomes.length; i++) {
    outcomes[i].outcomeworkflow = outcomeworkflows[i].id
    outcomes[i].through_no_drag = outcomeworkflows[i].no_drag
  }
  if (outcomes.length == 0) return outcomes.map((outcome) => outcome.id)
  let base_title = Utility.capWords(window.gettext('outcomes'))
  let object_sets = object_sets_unfiltered.filter(
    (objectset) => objectset.term == outcomes[0].type
  )
  if (object_sets.length == 0)
    return [
      {
        objectset: { title: base_title },
        outcomes: outcomes.map((outcome) => outcome.id)
      }
    ]
  let uncategorized = outcomes
    .filter((outcome) => outcome.sets.length == 0)
    .map((outcome) => outcome.id)
  let categories = []
  if (uncategorized.length > 0)
    categories = [
      {
        objectset: { title: window.gettext('Uncategorized') },
        outcomes: uncategorized
      }
    ]
  categories = [
    ...categories,
    ...object_sets
      .filter((objectset) => !objectset.hidden)
      .map((objectset) => ({
        objectset: objectset,
        outcomes: outcomes
          .filter((outcome) => outcome.sets.indexOf(objectset.id) >= 0)
          .map((outcome) => outcome.id)
      }))
  ]
  return categories
}

//Used in the Alignment View
export const getDescendantOutcomes = (state, outcome, outcomes) => {
  if (outcome.depth >= 2) return
  let children = outcome.child_outcome_links
    .map((id) => getOutcomeOutcomeByID(state, id))
    .map(
      (outcomeoutcome) => getOutcomeByID(state, outcomeoutcome.data.child).data
    )
  for (let i = 0; i < children.length; i++) {
    outcomes.push(children[i].id)
    getDescendantOutcomes(state, children[i], outcomes)
  }
}
