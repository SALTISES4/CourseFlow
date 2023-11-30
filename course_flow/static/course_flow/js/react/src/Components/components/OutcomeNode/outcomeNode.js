import React from 'react'
import { getTableOutcomeNodeByID } from '../../../FindState.js'
import { filterThenSortByID } from '../../../UtilityFunctions.js'

/**
 * Used in the table. Creates a shaped tree-like structure
 * for an outcome and its children that includes each one's
 * relationship to each node.
 *
 * @param props
 * @param outcome_id
 * @param nodecategory
 * @returns {{outcomenodes: *[], children: *[], id}|null}
 */
export function createOutcomeNodeBranch(props, outcome_id, nodecategory) {
  for (let i = 0; i < props.outcome.length; i++) {
    if (props.outcome[i].id === outcome_id) {
      let children

      if (
        props.outcome[i].child_outcome_links.length === 0 ||
        props.outcome[i].depth >= 2
      )
        children = []
      else
        children = filterThenSortByID(
          props.outcomeoutcome,
          props.outcome[i].child_outcome_links
        ).map((outcomeoutcome) =>
          createOutcomeNodeBranch(props, outcomeoutcome.child, nodecategory)
        )

      let outcomenodes = []

      for (var ii = 0; ii < nodecategory.length; ii++) {
        let category = nodecategory[ii]
        let outcomenodes_group = []
        for (var j = 0; j < category.nodes.length; j++) {
          let node = category.nodes[j]
          let outcomenode = getTableOutcomeNodeByID(
            props.outcomenode,
            node,
            outcome_id
          ).data
          if (outcomenode) {
            outcomenodes_group.push({
              node_id: node,
              degree: outcomenode.degree
            })
            continue
          }
          //If the outcomenode doesn't exist and there are children, check them.
          let added = false
          for (var k = 0; k < children.length; k++) {
            if (children[k].outcomenodes[ii][j].degree !== null) {
              outcomenodes_group.push({ node_id: node, degree: 0 })
              added = true
              break
            }
          }
          if (!added) outcomenodes_group.push({ node_id: node, degree: null })
        }
        let total = null
        if (children.length > 0) {
          total = 15
          let all_null = true
          for (let k = 0; k < children.length; k++) {
            var child_total = children[k].outcomenodes[ii].total
            if (child_total !== null) all_null = false
            total &= child_total
          }
          if (all_null) total = null
        } else {
          total = outcomenodes_group.reduce((acc, curr) => {
            if (curr.degree === null) return acc
            if (acc === null) return curr.degree
            return acc | curr.degree
          }, null)
        }
        outcomenodes_group.total = total
        outcomenodes.push(outcomenodes_group)
      }
      let total = null
      if (children.length > 0) {
        total = 15
        let all_null = true
        for (let k = 0; k < children.length; k++) {
          var child_total = children[k].outcomenodes.total
          if (child_total !== null) all_null = false
          total &= child_total
        }
        if (all_null) total = null
      } else {
        total = outcomenodes.reduce((acc, curr) => {
          if (curr.total === null) return acc
          if (acc === null) return curr.total
          return acc | curr.total
        }, null)
      }
      outcomenodes.total = total
      return { id: outcome_id, children: children, outcomenodes: outcomenodes }
    }
  }
  return null
}

/**
 * Based on an outcomenode's completion status, return the correct icon
 *
 * @param completion_status
 * @param outcomes_type
 * @returns {JSX.Element|*[]}
 */
export function getCompletionImg(completion_status, outcomes_type) {
  let contents = []

  if (outcomes_type === 0 || completion_status & 1) {
    return (
      <img
        className="self-completed"
        src={config.icon_path + 'solid_check.svg'}
      />
    )
  }
  if (completion_status & 2) {
    let divclass = ''
    contents.push(
      <div className={'outcome-introduced outcome-degree' + divclass}>I</div>
    )
  }
  if (completion_status & 4) {
    let divclass = ''
    contents.push(
      <div className={'outcome-developed outcome-degree' + divclass}>D</div>
    )
  }
  if (completion_status & 8) {
    let divclass = ''
    contents.push(
      <div className={'outcome-advanced outcome-degree' + divclass}>A</div>
    )
  }
  return contents
}
