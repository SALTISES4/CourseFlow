import { getTableOutcomeNodeByID } from '@cfFindState'
import {filterThenSortByID} from "@cfModule/utility/utilityFunctions";

export type CreateOutcomeNodeBranchType = {
  id: any
  children: any
  outcomenodes: any
  total: any
}
// export function createOutcomeNodeBranch(
//   props,
//   outcomeId: number,
//   nodeCategories
// ): CreateOutcomeNodeBranchType {
//   console.log('createOutcomeNodeBranch props')
//   console.log(props)
//
//   console.log('createOutcomeNodeBranch  nodeCategories')
//   console.log(nodeCategories)
//
//   const outcome = props.outcome.find((o) => o.id === outcomeId)
//   if (!outcome) return null
//
//   const children = createChildren(outcome, props, nodeCategories)
//
//   const outcomenodes = nodeCategories.map((category, categoryIndex) =>
//     createOutcomeNodesGroup(props, category, outcomeId, children, categoryIndex)
//   )
//
//   const total = calculateTotal(children, outcomenodes)
//
//   return { id: outcomeId, children, outcomenodes, total }
// }

// @todo screwed something up in the refactor, wait for typing
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
          // @ts-ignore
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
        // @ts-ignore
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
      // @ts-ignore
      outcomenodes.total = total
      return { id: outcome_id, children: children, outcomenodes: outcomenodes }
    }
  }
  return null
}

function createChildren(outcome, props, nodeCategories) {
  if (outcome.child_outcome_links.length === 0 || outcome.depth >= 2) return []

  return outcome.child_outcome_links.map((link) =>
    createOutcomeNodeBranch(props, link.child, nodeCategories)
  )
}

function createOutcomeNodesGroup(
  props,
  category,
  outcomeId,
  children,
  categoryIndex
) {
  const outcomenodesGroup = category.nodes.map((node) => {
    const outcomenode = getOutcomeNode(props, node, outcomeId)
    if (outcomenode) return { node_id: node, degree: outcomenode.degree }

    return createOutcomeNodeForChildren(node, children, categoryIndex)
  })

  const total = calculateGroupTotal(children, outcomenodesGroup)

  return { ...outcomenodesGroup, total }
}

function getOutcomeNode(props, nodeId, outcomeId) {
  return getTableOutcomeNodeByID(props.outcomenode, nodeId, outcomeId).data
}

function createOutcomeNodeForChildren(nodeId, children, categoryIndex) {
  for (const child of children) {
    if (child?.outcomenodes[categoryIndex][nodeId].degree !== null) {
      return {
        node_id: nodeId,
        degree: 0
      }
    }
  }
  return { node_id: nodeId, degree: null }
}

function calculateGroupTotal(children, outcomenodesGroup) {
  if (children.length > 0) {
    return calculateTotalForChildren(children, outcomenodesGroup)
  }
  return outcomenodesGroup.reduce((acc, curr) => {
    if (curr.degree === null) return acc
    return acc === null ? curr.degree : acc | curr.degree
  }, null)
}

function calculateTotalForChildren(children, outcomenodesGroup) {
  let total = 15
  let allNull = true
  for (const child of children) {
    const childTotal = outcomenodesGroup.map((group) => group.total)
    if (childTotal !== null) allNull = false
    total &= childTotal
  }
  return allNull ? null : total
}

function calculateTotal(children, outcomenodes) {
  if (children.length > 0) {
    return children.reduce((acc, child) => {
      const childTotal = child?.outcomenodes.total
      if (childTotal !== null) return acc & childTotal
      return acc
    }, 15)
  }
  return outcomenodes.reduce((acc, group) => {
    const groupTotal = group.total
    if (groupTotal === null) return acc
    return acc === null ? groupTotal : acc | groupTotal
  }, null)
}

/*Used in the table. Creates a shaped tree-like structure for an outcome and its children that includes each one's relationship to each node.*/
// export function createOutcomeNodeBranch(props, outcome_id, nodecategory) {
//   for (let i = 0; i < props.outcome.length; i++) {
//     if (props.outcome[i].id === outcome_id) {
//       let children
//
//       if (
//         props.outcome[i].child_outcome_links.length === 0 ||
//         props.outcome[i].depth >= 2
//       )
//         children = []
//       else
//         children = filterThenSortByID(
//           props.outcomeoutcome,
//           props.outcome[i].child_outcome_links
//         ).map((outcomeoutcome) =>
//           createOutcomeNodeBranch(props, outcomeoutcome.child, nodecategory)
//         )
//
//       const outcomenodes = []
//
//       for (var ii = 0; ii < nodecategory.length; ii++) {
//         const category = nodecategory[ii]
//         const outcomenodes_group = []
//         for (var j = 0; j < category.nodes.length; j++) {
//           const node = category.nodes[j]
//           const outcomenode = getTableOutcomeNodeByID(
//             props.outcomenode,
//             node,
//             outcome_id
//           ).data
//           if (outcomenode) {
//             outcomenodes_group.push({
//               node_id: node,
//               degree: outcomenode.degree
//             })
//             continue
//           }
//           //If the outcomenode doesn't exist and there are children, check them.
//           let added = false
//           for (var k = 0; k < children.length; k++) {
//             if (children[k].outcomenodes[ii][j].degree !== null) {
//               outcomenodes_group.push({ node_id: node, degree: 0 })
//               added = true
//               break
//             }
//           }
//           if (!added) outcomenodes_group.push({ node_id: node, degree: null })
//         }
//         let total = null
//         if (children.length > 0) {
//           total = 15
//           let all_null = true
//           for (let k = 0; k < children.length; k++) {
//             var child_total = children[k].outcomenodes[ii].total
//             if (child_total !== null) all_null = false
//             total &= child_total
//           }
//           if (all_null) total = null
//         } else {
//           total = outcomenodes_group.reduce((acc, curr) => {
//             if (curr.degree === null) return acc
//             if (acc === null) return curr.degree
//             return acc | curr.degree
//           }, null)
//         }
//         outcomenodes_group.total = total
//         outcomenodes.push(outcomenodes_group)
//       }
//       let total = null
//       if (children.length > 0) {
//         total = 15
//         let all_null = true
//         for (let k = 0; k < children.length; k++) {
//           var child_total = children[k].outcomenodes.total
//           if (child_total !== null) all_null = false
//           total &= child_total
//         }
//         if (all_null) total = null
//       } else {
//         total = outcomenodes.reduce((acc, curr) => {
//           if (curr.total === null) return acc
//           if (acc === null) return curr.total
//           return acc | curr.total
//         }, null)
//       }
//       outcomenodes.total = total
//       return { id: outcome_id, children: children, outcomenodes: outcomenodes }
//     }
//   }
//   return null
// }
