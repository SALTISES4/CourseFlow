import { CFRoutes } from '@cf/router/appRoutes'
import { WorkspaceType } from '@cf/types/enum'
import { MaybeWithId, hasId } from '@cf/types/typeGuards'
import { generatePath } from 'react-router-dom'

type GenericObject = {
  [key: string]: string | GenericObject
}

class Utility {
  /*******************************************************
   * ARRAYS / OBJECTS
   *******************************************************/
  /**
   * take a list of objects, then filter it based on which appear in the id list. The list is then resorted to match the order in the id list.
   * @param objectList
   * @param idList
   */
  static filterThenSortById<T extends object>(
    objectList: MaybeWithId<T>[],
    idList: any[]
  ): T[] {
    return objectList
      .filter(
        (obj): obj is T & { id: any } => hasId(obj) && idList.includes(obj.id)
      )
      .sort((a, b) => idList.indexOf(a.id) - idList.indexOf(b.id))
  }

  /**
   *
   * @param obj
   * @param prefix
   */
  static addPrefixToLeafStrings<T>(obj: GenericObject, prefix: string): T {
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
  static wrapLeafStrings<T>(obj: GenericObject): T {
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

  /**
   * Do a bit of cleaning to unescape certain characters and display them correctly
   * @param string
   */
  static unescapeCharacters(string) {
    return string
      .replace(/&amp;/g, '&')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
  }

  static getUserDisplay(user) {
    let str = ''
    if (user.firstName) {
      str += user.firstName + ' '
    }
    if (user.lastName) {
      str += user.lastName + ' '
    }
    if (!str && user.username) {
      str = user.username + ' '
    }
    return str || user.email
  }

  /*******************************************************
   *  Type Related
   *******************************************************/
  /**
   * use the enum proxy stopgap
   * @param baseEnum
   * @constructor
   */
  static enum(baseEnum) {
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

  static convertEnum<T>(
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
  static formatDate(dateString: Date) {
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
   * Check if a cfobject (such as a node or an outcome) should be hidden based on its sets and the currently active object sets
   * @param data
   * @param objectsets
   */
  static checkSetHidden(data, objectsets) {
    if (!(data?.sets.length > 0) || !objectsets) {
      return false
    }

    return !objectsets.some((set) => !set.hidden && data.sets.includes(set.id))
  }

  /**
   *
   **/
  static pushOrCreate(obj, index, value) {
    if (obj[index]) {
      obj[index].push(value)
    } else {
      obj[index] = [value]
    }
  }

  /**
   * Find and return the best way to display a user's name, username, or email (if that's all we have)
   * @param k1
   * @param k2
   */
  static cantorPairing(k1, k2) {
    return parseInt(((k1 + k2) * (k1 + k2 + 1)) / 2 + k2)
  }

  /**
   *
   **/
  static getPathByObject(id: number, object: WorkspaceType): string {
    switch (object) {
      case WorkspaceType.PROJECT:
        return generatePath(CFRoutes.PROJECT, { id: String(id) })
      case WorkspaceType.WORKFLOW:
        return generatePath(CFRoutes.WORKFLOW, { id: String(id) })
      default:
        break
    }
    return CFRoutes.HOME
  }

  /**
   * @replaceEmptyStringsWithNull
   **/
  static replaceEmptyStringsWithNull(obj: any): any {
    // Check if the object is an array
    if (Array.isArray(obj)) {
      return obj.map(Utility.replaceEmptyStringsWithNull)
    }

    // Check if the object is not null and is an object
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce(
        (acc, key) => {
          const value = obj[key]

          // Recursively apply for nested objects or arrays
          acc[key] = Utility.replaceEmptyStringsWithNull(value)

          return acc
        },
        {} as { [key: string]: any }
      )
    }

    // Replace empty string with null
    return obj === '' ? null : obj
  }

  /**
   * @stringifyMaxDepth
   * never used
   **/
  // static stringifyMaxDepth(obj, depth = 1) {
  //   if (!obj || typeof obj !== 'object') {
  //     return JSON.stringify(obj)
  //   }
  //
  //   let curDepthResult = '"<?>"' // too deep
  //   if (depth > 0) {
  //     curDepthResult = Object.keys(obj)
  //       .map((key) => {
  //         let val = Utility.stringifyMaxDepth(obj[key], depth - 1)
  //         if (val === undefined) {
  //           val = 'null'
  //         }
  //         return `"${key}": ${val}`
  //       })
  //       .join(', ')
  //     curDepthResult = `{${curDepthResult}}`
  //   }
  //
  //   return JSON.stringify(JSON.parse(curDepthResult))
  // }
}

export default Utility

/**
 * thin wrapper around the global python gettext method
 * @param str
 */
export const _t = (str: string) => {
  return window.gettext(str)
}
