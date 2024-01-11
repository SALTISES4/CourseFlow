// @ts-nocheck
import * as React from 'react'

export function permission_translate() {
  return {
    author: window.gettext('Owner'),
    edit: window.gettext('Editor'),
    comment: window.gettext('Commenter'),
    view: window.gettext('Viewer')
  }
}

// @todo move to component
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
    for (let i = 0; i < objectsets.length; i++) {
      if (!objectsets[i].hidden && data.sets.indexOf(objectsets[i].id) >= 0) {
        hidden = false
        break
      }
    }
  }
  return hidden
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
export function filterThenSortByID<P>(object_list: P[], id_list): P[] {
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
      const event = new Event(eventname, {
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

export const debounce = (func, timeout = 300) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, timeout)
  }
}

// @todo move to component
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
