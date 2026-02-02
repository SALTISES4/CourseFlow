import { defaultColumnSettings } from '@cf/utility/constants'
import { _t } from '@cf/utility/Utility.class'

class ThemeHelper {
  static getInitials(name: string): string {
    const split = name.trim().split(' ')

    if (split.length >= 2) {
      return `${split[0][0]}${split[split.length - 1][0]}`
    }

    return `${name[0]}${name[1]}`
  }

  static getBorderStyle({
    isLocked,
    colour
  }: {
    isLocked?: boolean
    colour?: string
  }) {
    if (!isLocked || !colour) {
      return {}
    }
    return {
      border: `2px solid ' + ${colour}`
    }
  }

  /**
   * capitalize first letter of each word in a string
   * @param str
   */
  static capWords(str: string) {
    return str
      .split(' ')
      .map((entry) => {
        if (entry.length === 0) {
          return entry
        }
        return entry[0].toUpperCase() + entry.substr(1)
      })
      .join(' ')
  }

  static getNameInitials(name: string) {
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

  static capFirst(str: string) {
    return str[0].toUpperCase() + str.slice(1)
  }

  /**
   * Check if the mouse event is within a box with the given padding around the element
   * @param evt
   * @param elem
   * @param padding
   */
  static mouseOutsidePadding(evt, elem, padding) {
    if (elem.length === 0) {
      return true
    }
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
  static getSVGTranslation(transform) {
    return transform
      .substring(transform.indexOf('translate(') + 10, transform.indexOf(')'))
      .split(',')
  }

  static getElementOffset(element: HTMLElement | Element): {
    top: number
    left: number
  } {
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
   *
   *******************************************************/
  // static debounce = (func, timeout = 300) => {
  //   // @todo find where this is being used and replace it with standard one
  //
  //   let timer
  //   return (...args) => {
  //     clearTimeout(timer)
  //     timer = setTimeout(() => {
  //       func.apply(this, args)
  //     }, timeout)
  //   }
  // }

  /**
   * A utility function to trigger an event on each element. This is used to avoid .trigger, which bubbles (we will be careful to only trigger events on the elements that need them)
   * @param trigger
   * @param eventname
   */
  static triggerHandlerEach(trigger, eventname) {
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
   * UI
   *******************************************************/

  /**
   * Get the offset from the canvas of a specific jquery object
   * @param nodeDom
   */
  static getCanvasOffset(nodeDom): {
    top: number
    left: number
  } {
    const nodeOffset = nodeDom.offset()
    const canvasElement = document.querySelector('.workflow-canvas')
    const canvasOffset = ThemeHelper.getElementOffset(canvasElement)

    nodeOffset.left -= canvasOffset.left
    nodeOffset.top -= canvasOffset.top

    return nodeOffset
  }

  /*******************************************************
   * COLOUR FORMATS, VALUES AND CONVERSIONS
   *******************************************************/

  /*******************************************************
   * this method randomly creates a colour based on the user ID
   * it probably shouldn't be in the frontemd
   *******************************************************/

  /**
   * Get the colour from a column
   *  @todo broken
   **/
  static getColumnColour({
    columnType,
    colour
  }: {
    columnType: number
    colour?: number | string | null
  }): string {
    if (colour && typeof colour === 'number') {
      return this.decimalToHex(colour)
    }

    return colour ?? (defaultColumnSettings[columnType]?.colour || '')
  }

  static generateColorFromIntToHex(id: number) {
    // Use a large prime here to avoid having modulo 0
    const hue = (id * 41) % 360

    // Set saturation and lightness to fixed values
    const saturation = 50
    const lightness = 50

    return this.hslToHex(hue, saturation, lightness)
  }

  static decimalToHex(val: number): string {
    return '#' + ('000000' + val?.toString(16)).slice(-6)
  }

  static hslToHex(h, s, l) {
    l /= 100
    const a = (s * Math.min(l, 1 - l)) / 100
    const f = (n) => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0') // convert to Hex and prefix "0" if needed
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }
}

export default ThemeHelper
//
//
// /**
//  * capitalize first letter of each word in a string
//  * @param str
//  */
// export function capWords(str: string) {
//   return str
//     .split(' ')
//     .map((entry) => {
//       if (entry.length === 0) {
//         return entry
//       }
//       return entry[0].toUpperCase() + entry.substr(1)
//     })
//     .join(' ')
// }
//
// export function getNameInitials(name: string) {
//   if (!name) {
//     return ''
//   }
//
//   const split = name.trim().split(' ')
//   const fName = split[0][0].toUpperCase()
//
//   if (split.length === 1) {
//     return fName
//   }
//
//   const lName = split[1][0].toUpperCase()
//   return `${fName}${lName}`
// }
//
// export function capFirst(str) {
//   return str[0].toUpperCase() + str.substr(1)
// }
//
// /**
//  * Do a bit of cleaning to unescape certain characters and display them correctly
//  * @param string
//  */
// export function unescapeCharacters(string) {
//   return string
//     .replace(/&amp;/g, '&')
//     .replace(/&gt;/g, '>')
//     .replace(/&lt;/g, '<')
// }
//
// export function getUserDisplay(user) {
//   let str = ''
//   if (user.firstName) {
//     str += user.firstName + ' '
//   }
//   if (user.lastName) {
//     str += user.lastName + ' '
//   }
//   if (!str && user.username) {
//     str = user.username + ' '
//   }
//   return str || user.email
// }
//
// /*******************************************************
//  * UI
//  *******************************************************/
//
// /**
//  * Get the offset from the canvas of a specific jquery object
//  * @param nodeDom
//  */
// export function getCanvasOffset(nodeDom): {
//   top: number
//   left: number
// } {
//   const nodeOffset = nodeDom.offset()
//   const canvasElement = document.querySelector('.workflow-canvas')
//   const canvasOffset = getElementOffset(canvasElement)
//
//   nodeOffset.left -= canvasOffset.left
//   nodeOffset.top -= canvasOffset.top
//
//   return nodeOffset
// }
//
// /**
//  * Check if the mouse event is within a box with the given padding around the element
//  * @param evt
//  * @param elem
//  * @param padding
//  */
// export function mouseOutsidePadding(evt, elem, padding) {
//   if (elem.length === 0) {
//     return true
//   }
//   const offset = elem.offset()
//   const width = elem.outerWidth()
//   const height = elem.outerHeight()
//   return (
//     evt.pageX < offset.left - padding ||
//     evt.pageY < offset.top - padding ||
//     evt.pageX > offset.left + width + padding ||
//     evt.pageY > offset.top + height + padding
//   )
// }
//
// /**
//  * Get translate from an svg transform
//  * @param transform
//  */
// export function getSVGTranslation(transform) {
//   return transform
//     .substring(transform.indexOf('translate(') + 10, transform.indexOf(')'))
//     .split(',')
// }
//
// function getElementOffset(element) {
//   const rect = element.getBoundingClientRect()
//   const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
//   const scrollTop = window.pageYOffset || document.documentElement.scrollTop
//
//   return {
//     top: rect.top + scrollTop,
//     left: rect.left + scrollLeft
//   }
// }
// /*******************************************************
//  * UX
//  *******************************************************/
// export const debounce = (func, timeout = 300) => {
//   let timer
//   return (...args) => {
//     clearTimeout(timer)
//     timer = setTimeout(() => {
//       func.apply(this, args)
//     }, timeout)
//   }
// }
//
// /**
//  * A utility function to trigger an event on each element. This is used to avoid .trigger, which bubbles (we will be careful to only trigger events on the elements that need them)
//  * @param trigger
//  * @param eventname
//  */
// export function triggerHandlerEach(trigger, eventname) {
//   // @todo this has beeen moved away from jQuery but we aren't sure yet whether the passed element
//   // trigger will work outside a jquery object yet
//   return trigger.each((i, element) => {
//     if (element) {
//       const event = new Event(eventname, {
//         bubbles: true, // This makes the event bubble up
//         cancelable: true // This makes the event cancelable
//       })
//
//       element.dispatchEvent(event)
//     }
//   })
// }
