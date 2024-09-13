import { MaybeWithId, hasId } from '@cf/types/typeGuards'
import * as React from 'react'

type GenericObject = {
  [key: string]: string | GenericObject
}

/*******************************************************
 * ARRAYS / OBJECTS
 *******************************************************/
/**
 * take a list of objects, then filter it based on which appear in the id list. The list is then resorted to match the order in the id list.
 * @param object_list
 * @param id_list
 */
export function filterThenSortByID<T extends object>(
  object_list: MaybeWithId<T>[],
  id_list: any[]
): T[] {
  return object_list
    .filter(
      (obj): obj is T & { id: any } => hasId(obj) && id_list.includes(obj.id)
    )
    .sort((a, b) => id_list.indexOf(a.id) - id_list.indexOf(b.id))
}

/**
 *
 * @param obj
 * @param prefix
 */
export function addPrefixToLeafStrings<T>(
  obj: GenericObject,
  prefix: string
): T {
  const traverse = (currentObj: GenericObject): GenericObject => {
    Object.keys(currentObj).forEach((key) => {
      if (typeof currentObj[key] === 'string') {
        currentObj[key] = prefix + currentObj[key]
      } else if (
        typeof currentObj[key] === 'object' &&
        currentObj[key] !== null
      ) {
        if (typeof currentObj === 'object') {
          currentObj[key] = traverse(currentObj[key] as GenericObject)
        }
      }
    })
    return currentObj
  }

  const clonedObj = JSON.parse(JSON.stringify(obj))
  return traverse(clonedObj) as T
}

/**
 *
 * @param obj
 */
export function wrapLeafStrings<T>(obj: GenericObject): T {
  const traverse = (currentObj: GenericObject): GenericObject => {
    Object.keys(currentObj).forEach((key) => {
      if (typeof currentObj[key] === 'string') {
        // Wrap the string with _t()
        currentObj[key] = _t(currentObj[key] as string)
      } else if (
        typeof currentObj[key] === 'object' &&
        currentObj[key] !== null
      ) {
        currentObj[key] = traverse(currentObj[key] as GenericObject)
      }
    })
    return currentObj
  }

  const clonedObj = JSON.parse(JSON.stringify(obj))
  return traverse(clonedObj) as T
}

/*******************************************************
 * STRINGS
 *******************************************************/
export function getInitials(name: string): string {
  const split = name.split(' ')
  return `${split[0][0]}${split[split.length - 1][0]}`
}

/**
 * thin wrapper around the glbal python gettext method
 * @param str
 */
export const _t = (str: string) => {
  return window.gettext(str)
}

/**
 * capitalize first letter of each word in a string
 * @param str
 */
export function capWords(str: string) {
  return str
    .split(' ')
    .map((entry) => {
      if (entry.length === 0) return entry
      return entry[0].toUpperCase() + entry.substr(1)
    })
    .join(' ')
}

export function getNameInitials(name: string) {
  if (!name) {
    return ''
  }

  const split = name.trim().split(' ')
  const fName = split[0][0].toUpperCase()

  if (split.length === 1) {
    return fName
  }

  const lName = split[1][0].toUpperCase()
  return `${fName}${lName}`
}

export function capFirst(str) {
  return str[0].toUpperCase() + str.substr(1)
}

/**
 * Do a bit of cleaning to unescape certain characters and display them correctly
 * @param string
 */
export function unescapeCharacters(string) {
  return string
    .replace(/\&amp;/g, '&')
    .replace(/\&gt;/g, '>')
    .replace(/\&lt;/g, '<')
}

export function getUserDisplay(user) {
  let str = ''
  if (user.first_name) str += user.first_name + ' '
  if (user.last_name) str += user.last_name + ' '
  if (!str && user.username) str = user.username + ' '
  return str || user.email
}

/*******************************************************
 * UI
 *******************************************************/

/**
 * Get the offset from the canvas of a specific jquery object
 * @param node_dom
 */
export function getCanvasOffset(node_dom) {
  const node_offset = node_dom.offset()
  const canvasElement = document.querySelector('.workflow-canvas')
  const canvas_offset = getElementOffset(canvasElement)

  node_offset.left -= canvas_offset.left
  node_offset.top -= canvas_offset.top

  return node_offset
}

/**
 * Check if the mouse event is within a box with the given padding around the element
 * @param evt
 * @param elem
 * @param padding
 */
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

/**
 * Get translate from an svg transform
 * @param transform
 */
export function getSVGTranslation(transform) {
  return transform
    .substring(transform.indexOf('translate(') + 10, transform.indexOf(')'))
    .split(',')
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
/*******************************************************
 * UX
 *******************************************************/
export const debounce = (func, timeout = 300) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, timeout)
  }
}

/**
 * A utility function to trigger an event on each element. This is used to avoid .trigger, which bubbles (we will be careful to only trigger events on the elements that need them)
 * @param trigger
 * @param eventname
 */
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

/*******************************************************
 *  Type Related
 *******************************************************/
/**
 * use the enum proxy stopgap
 * @param baseEnum
 * @constructor
 */
export function Enum(baseEnum) {
  return new Proxy(baseEnum, {
    get(target, name) {
      if (!baseEnum.hasOwnProperty(name)) {
        throw new Error(`"${String(name)}" value does not exist in the enum`)
      }
      return baseEnum[name]
    },
    set(target, name, value) {
      throw new Error('Cannot add a new value to the enum')
    }
  })
}

export function convertEnum<T>(
  value: string,
  enumType: { [key: string]: T },
  defaultValue: T
): T {
  for (const key in enumType) {
    if (enumType[key] === value) {
      return enumType[key]
    }
  }
  return defaultValue
}
/*******************************************************
 * DATE TIME
 *******************************************************/
export function formatDate(dateString: Date) {
  const date = new Date(dateString)

  // Create an Intl.DateTimeFormat instance with desired options
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  return formatter.format(date)
}
/*******************************************************
 * SORT / MISC
 *******************************************************/

/**
 *  Get the little tag that sits in front of usernames signifying the role
 *  @todo move to component
 * @param user_type
 */
export function getUserTag(user_type) {
  function permission_translate() {
    return {
      author: _t('Owner'),
      edit: _t('Editor'),
      comment: _t('Commenter'),
      view: _t('Viewer')
    }
  }
  return (
    <span className={'user-tag permission-' + user_type}>
      {permission_translate()[user_type]}
    </span>
  )
}

/**
 * Check if a cfobject (such as a node or an outcome) should be hidden based on its sets and the currently active object sets
 * @param data
 * @param objectsets
 */
export function checkSetHidden(data, objectsets) {
  if (data.sets.length === 0 || !objectsets) {
    return false
  }

  return !objectsets.some((set) => !set.hidden && data.sets.includes(set.id))
}

export function pushOrCreate(obj, index, value) {
  if (obj[index]) obj[index].push(value)
  else obj[index] = [value]
}

/**
 * Find and return the best way to display a user's name, username, or email (if that's all we have)
 * @param k1
 * @param k2
 */
export function cantorPairing(k1, k2) {
  return parseInt(((k1 + k2) * (k1 + k2 + 1)) / 2 + k2)
}
