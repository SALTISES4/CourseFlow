import Utility, { _t } from '@cf/utility/Utility.class'
import { getTableOutcomeNodeByID } from '@cfFindState'

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
export function createOutcomeNodeBranch(props, outcomeId, nodecategory) {
  for (let i = 0; i < props.outcome.length; i++) {
    if (props.outcome[i].id === outcomeId) {
      let children

      if (
        props.outcome[i].childOutcomeLinks.length === 0 ||
        props.outcome[i].depth >= 2
      ) {
        children = []
      } else {
        children = Utility.filterThenSortById(
          props.outcomeoutcome,
          props.outcome[i].childOutcomeLinks
        ).map((outcomeoutcome) =>
          // @ts-ignore
          createOutcomeNodeBranch(props, outcomeoutcome.child, nodecategory)
        )
      }

      const outcomenodes = []

      for (let ii = 0; ii < nodecategory.length; ii++) {
        const category = nodecategory[ii]
        const outcomenodesGroup = []
        for (let j = 0; j < category.nodes.length; j++) {
          const node = category.nodes[j]
          const outcomenode = getTableOutcomeNodeByID(
            props.outcomenode,
            node,
            outcomeId
          ).data
          if (outcomenode) {
            outcomenodesGroup.push({
              nodeId: node,
              degree: outcomenode.degree
            })
            continue
          }
          //If the outcomenode doesn't exist and there are children, check them.
          let added = false
          for (let k = 0; k < children.length; k++) {
            if (children[k].outcomenodes[ii][j].degree !== null) {
              outcomenodesGroup.push({ nodeId: node, degree: 0 })
              added = true
              break
            }
          }
          if (!added) {
            outcomenodesGroup.push({ nodeId: node, degree: null })
          }
        }
        let total = null
        if (children.length > 0) {
          total = 15
          let allNull = true
          for (let k = 0; k < children.length; k++) {
            var childTotal = children[k].outcomenodes[ii].total
            if (childTotal !== null) {
              allNull = false
            }
            total &= childTotal
          }
          if (allNull) {
            total = null
          }
        } else {
          total = outcomenodesGroup.reduce((acc, curr) => {
            if (curr.degree === null) {
              return acc
            }
            if (acc === null) {
              return curr.degree
            }
            return acc | curr.degree
          }, null)
        }
        // @ts-ignore
        outcomenodesGroup.total = total
        outcomenodes.push(outcomenodesGroup)
      }
      let total = null
      if (children.length > 0) {
        total = 15
        let allNull = true
        for (let k = 0; k < children.length; k++) {
          var childTotal = children[k].outcomenodes.total
          if (childTotal !== null) {
            allNull = false
          }
          total &= childTotal
        }
        if (allNull) {
          total = null
        }
      } else {
        total = outcomenodes.reduce((acc, curr) => {
          if (curr.total === null) {
            return acc
          }
          if (acc === null) {
            return curr.total
          }
          return acc | curr.total
        }, null)
      }
      outcomenodes.total = total
      return { id: outcomeId, children: children, outcomenodes: outcomenodes }
    }
  }
  return null
}

function createChildren(outcome, props, nodeCategories) {
  if (outcome.childOutcomeLinks.length === 0 || outcome.depth >= 2) {
    return []
  }

  return outcome.childOutcomeLinks.map((link) =>
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
    if (outcomenode) {
      return { nodeId: node, degree: outcomenode.degree }
    }

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
        nodeId: nodeId,
        degree: 0
      }
    }
  }
  return { nodeId: nodeId, degree: null }
}

function calculateGroupTotal(children, outcomenodesGroup) {
  if (children.length > 0) {
    return calculateTotalForChildren(children, outcomenodesGroup)
  }
  return outcomenodesGroup.reduce((acc, curr) => {
    if (curr.degree === null) {
      return acc
    }
    return acc === null ? curr.degree : acc | curr.degree
  }, null)
}

function calculateTotalForChildren(children, outcomenodesGroup) {
  let total = 15
  let allNull = true
  for (const child of children) {
    const childTotal = outcomenodesGroup.map((group) => group.total)
    if (childTotal !== null) {
      allNull = false
    }
    total &= childTotal
  }
  return allNull ? null : total
}

function calculateTotal(children, outcomenodes) {
  if (children.length > 0) {
    return children.reduce((acc, child) => {
      const childTotal = child?.outcomenodes.total
      if (childTotal !== null) {
        return acc & childTotal
      }
      return acc
    }, 15)
  }
  return outcomenodes.reduce((acc, group) => {
    const groupTotal = group.total
    if (groupTotal === null) {
      return acc
    }
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
//         props.outcome[i].childOutcomeLinks.length === 0 ||
//         props.outcome[i].depth >= 2
//       )
//         children = []
//       else
//         children = filterThenSortByID(
//           props.outcomeoutcome,
//           props.outcome[i].childOutcomeLinks
//         ).map((outcomeoutcome) =>
//           createOutcomeNodeBranch(props, outcomeoutcome.child, nodecategory)
//         )
//
//       const outcomenodes = []
//
//       for (var ii = 0; ii < nodecategory.length; ii++) {
//         const category = nodecategory[ii]
//         const outcomenodesGroup = []
//         for (var j = 0; j < category.nodes.length; j++) {
//           const node = category.nodes[j]
//           const outcomenode = getTableOutcomeNodeByID(
//             props.outcomenode,
//             node,
//             outcome_id
//           ).data
//           if (outcomenode) {
//             outcomenodesGroup.push({
//               nodeId: node,
//               degree: outcomenode.degree
//             })
//             continue
//           }
//           //If the outcomenode doesn't exist and there are children, check them.
//           let added = false
//           for (var k = 0; k < children.length; k++) {
//             if (children[k].outcomenodes[ii][j].degree !== null) {
//               outcomenodesGroup.push({ nodeId: node, degree: 0 })
//               added = true
//               break
//             }
//           }
//           if (!added) outcomenodesGroup.push({ nodeId: node, degree: null })
//         }
//         let total = null
//         if (children.length > 0) {
//           total = 15
//           let allNull = true
//           for (let k = 0; k < children.length; k++) {
//             var childTotal = children[k].outcomenodes[ii].total
//             if (childTotal !== null) allNull = false
//             total &= childTotal
//           }
//           if (allNull) total = null
//         } else {
//           total = outcomenodesGroup.reduce((acc, curr) => {
//             if (curr.degree === null) return acc
//             if (acc === null) return curr.degree
//             return acc | curr.degree
//           }, null)
//         }
//         outcomenodesGroup.total = total
//         outcomenodes.push(outcomenodesGroup)
//       }
//       let total = null
//       if (children.length > 0) {
//         total = 15
//         let allNull = true
//         for (let k = 0; k < children.length; k++) {
//           var childTotal = children[k].outcomenodes.total
//           if (childTotal !== null) allNull = false
//           total &= childTotal
//         }
//         if (allNull) total = null
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
