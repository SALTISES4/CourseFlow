import * as React from 'react'
import {
  getSortedOutcomesFromOutcomeWorkflowSet,
  getTableOutcomeNodeByID
} from '@cfFindState'

export function permission_translate() {
  return {
    author: window.gettext('Owner'),
    edit: window.gettext('Editor'),
    comment: window.gettext('Commenter'),
    view: window.gettext('Viewer')
  }
}

// Get the little tag that sits in front of usernames signifying the role
export function getUserTag(user_type) {
  return (
    <span className={'user-tag permission-' + user_type}>
      {permission_translate()[user_type]}
    </span>
  )
}

/**
 *  this has been refactored to remove jquery
 */
export class Loader {
  constructor(identifier) {
    // Create a new div element
    this.load_screen = document.createElement('div')
    this.load_screen.className = 'load-screen'

    // Prevent default click behavior
    this.load_screen.addEventListener('click', (evt) => {
      evt.preventDefault()
    })

    let parentElement
    if (identifier instanceof jQuery) {
      // Use the first element in the jQuery object
      parentElement = identifier.get(0)
    } else {
      // Use querySelector to find the element
      parentElement = document.querySelector(identifier)
    }

    if (parentElement) {
      parentElement.appendChild(this.load_screen)
    } else {
      console.error(`Element with identifier "${identifier}" not found.`)
    }
  }

  endLoad() {
    // Remove the load screen from its parent
    if (this.load_screen && this.load_screen.parentNode) {
      this.load_screen.parentNode.removeChild(this.load_screen)
    }
  }
}

//Check if an object (such as a node or an outcome) should be hidden based on its sets and the currently active object sets
export function checkSetHidden(data, objectsets) {
  let hidden = false
  if (data.sets.length > 0 && objectsets) {
    hidden = true
    for (var i = 0; i < objectsets.length; i++) {
      if (!objectsets[i].hidden && data.sets.indexOf(objectsets[i].id) >= 0) {
        hidden = false
        break
      }
    }
  }
  return hidden
}

export function download(filename, text) {
  var pom = document.createElement('a')
  pom.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
  )
  pom.setAttribute('download', filename)

  if (document.createEvent) {
    var event = document.createEvent('MouseEvents')
    event.initEvent('click', true, true)
    pom.dispatchEvent(event)
  } else {
    pom.click()
  }
}

// Do a bit of cleaning to unescape certain characters and display them correctly
export function unescapeCharacters(string) {
  return string
    .replace(/\&amp;/g, '&')
    .replace(/\&gt;/g, '>')
    .replace(/\&lt;/g, '<')
}

//Get translate from an svg transform
export function getSVGTranslation(transform) {
  return transform
    .substring(transform.indexOf('translate(') + 10, transform.indexOf(')'))
    .split(',')
}

export function pushOrCreate(obj, index, value) {
  if (obj[index]) obj[index].push(value)
  else obj[index] = [value]
}

// Find and return the best way to display a user's name, username, or email (if that's all we have)
export function getUserDisplay(user) {
  let str = ''
  if (user.first_name) str += user.first_name + ' '
  if (user.last_name) str += user.last_name + ' '
  if (!str && user.username) str = user.username + ' '
  return str || user.email
}

export function cantorPairing(k1, k2) {
  return parseInt(((k1 + k2) * (k1 + k2 + 1)) / 2 + k2)
}

//take a list of objects, then filter it based on which appear in the id list. The list is then resorted to match the order in the id list.
export function filterThenSortByID(object_list, id_list) {
  return object_list
    .filter((obj) => id_list.includes(obj.id))
    .sort((a, b) => id_list.indexOf(a.id) - id_list.indexOf(b.id))
}

//capitalize first letter of each word in a string
export function capWords(str) {
  return str
    .split(' ')
    .map((entry) => {
      if (entry.length === 0) return entry
      return entry[0].toUpperCase() + entry.substr(1)
    })
    .join(' ')
}

export function capFirst(str) {
  return str[0].toUpperCase() + str.substr(1)
}

//Get the offset from the canvas of a specific jquery object
export function getCanvasOffset(node_dom) {
  const node_offset = node_dom.offset()
  const canvasElement = document.querySelector('.workflow-canvas')
  const canvas_offset = getElementOffset(canvasElement)

  node_offset.left -= canvas_offset.left
  node_offset.top -= canvas_offset.top

  return node_offset
}

//Check if the mouse event is within a box with the given padding around the element
export function mouseOutsidePadding(evt, elem, padding) {
  if (elem.length === 0) return true
  const offset = elem.offset()
  const width = elem.outerWidth()
  const height = elem.outerHeight()
  return (
    evt.pageX < offset.left - padding ||
    evt.pageY < offset.top - padding ||
    evt.pageX > offset.left + width + padding ||
    evt.pageY > offset.top + height + padding
  )
}

//A utility function to trigger an event on each element. This is used to avoid .trigger, which bubbles (we will be careful to only trigger events on the elements that need them)
export function triggerHandlerEach(trigger, eventname) {
  // @todo this has beeen moved away from jQuery but we aren't sure yet whether the passed element
  // trigger will work outside a jquery object yet
  return trigger.each((i, element) => {
    if (element) {
      var event = new Event(eventname, {
        bubbles: true, // This makes the event bubble up
        cancelable: true // This makes the event cancelable
      })

      element.dispatchEvent(event)
    }
  })
}

function getElementOffset(element) {
  const rect = element.getBoundingClientRect()
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop

  return {
    top: rect.top + scrollTop,
    left: rect.left + scrollLeft
  }
}

// use the enum proxy stopgap
export function Enum(baseEnum) {
  return new Proxy(baseEnum, {
    get(target, name) {
      if (!baseEnum.hasOwnProperty(name)) {
        throw new Error(`"${name}" value does not exist in the enum`)
      }
      return baseEnum[name]
    },
    set(target, name, value) {
      throw new Error('Cannot add a new value to the enum')
    }
  })
}

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
export function createOutcomeBranch(state, outcome_id) {
  for (let i = 0; i < state.outcome.length; i++) {
    if (state.outcome[i].id === outcome_id) {
      let children
      if (
        state.outcome[i].child_outcome_links.length === 0 ||
        state.outcome[i].depth >= 2
      )
        children = []
      else
        children = filterThenSortByID(
          state.outcomeoutcome,
          state.outcome[i].child_outcome_links
        ).map((outcomeoutcome) =>
          createOutcomeBranch(state, outcomeoutcome.child)
        )

      return { id: outcome_id, children: children }
    }
  }
  return null
}

/**
 * THIS IS NOT BEING USED
 * From the state, creates a tree structure for an outcome
 * @param state
 * @returns {*[]}
 */
export function createOutcomeTree(state) {
  const outcomes_tree = []
  const sorted_outcomes = getSortedOutcomesFromOutcomeWorkflowSet(
    state,
    state.workflow.outcomeworkflow_set
  )
  for (let i = 0; i < sorted_outcomes.length; i++) {
    const outcomes_tree_category = []
    for (let j = 0; j < sorted_outcomes[i].outcomes.length; j++)
      outcomes_tree_category.push(
        createOutcomeBranch(state, sorted_outcomes[i].outcomes[j].id)
      )
    outcomes_tree.push({
      title: sorted_outcomes[i].objectset.title,
      outcomes: outcomes_tree_category
    })
  }
  return outcomes_tree
}

/*From a tree structure of outcomes, flatten the tree*/
export function flattenOutcomeTree(outcomes_tree, array) {
  outcomes_tree.forEach((element) => {
    array.push(element.id)
    flattenOutcomeTree(element.children, array)
  })
}

export const debounce = (func, timeout = 300) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, timeout)
  }
}

/*Used in the table. Creates a shaped tree-like structure for an outcome and its children that includes each one's relationship to each node.*/
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

      const outcomenodes = []

      for (var ii = 0; ii < nodecategory.length; ii++) {
        const category = nodecategory[ii]
        const outcomenodes_group = []
        for (var j = 0; j < category.nodes.length; j++) {
          const node = category.nodes[j]
          const outcomenode = getTableOutcomeNodeByID(
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
  const contents = []

  if (outcomes_type === 0 || completion_status & 1) {
    return (
      <img
        className="self-completed"
        src={COURSEFLOW_APP.config.icon_path + 'solid_check.svg'}
      />
    )
  }
  if (completion_status & 2) {
    const divclass = ''
    contents.push(
      <div className={'outcome-introduced outcome-degree' + divclass}>I</div>
    )
  }
  if (completion_status & 4) {
    const divclass = ''
    contents.push(
      <div className={'outcome-developed outcome-degree' + divclass}>D</div>
    )
  }
  if (completion_status & 8) {
    const divclass = ''
    contents.push(
      <div className={'outcome-advanced outcome-degree' + divclass}>A</div>
    )
  }
  return contents
}
