import { CFRoutes } from '@cf/router/appRoutes'
import { WorkspaceType } from '@cf/types/enum'
import { MaybeWithId, hasId } from '@cf/types/typeGuards'
import { EDate } from '@XMLHTTP/types/entity'
import he from 'he'
import { generatePath } from 'react-router-dom'

type GenericObject = {
  [key: string]: string | GenericObject
}

// @todo this is a 'transition' class during global project restructure
// it should be broken apart into domain specific areas and converted to modules
class Utility {
  /*******************************************************
   * ARRAYS / OBJECTS
   *******************************************************/

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
   * Add a string wrapper around a nested object of strings
   *  used to format API routes mainly
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
   * Add a string wrapper around a nested object of strings
   * used to format API routes mainly
   * @param obj
   */
  static wrapLeafStrings<T>(obj: GenericObject): T {
    const traverse = (currentObj: GenericObject): GenericObject => {
      Object.keys(currentObj).forEach((key) => {
        if (typeof currentObj[key] === 'string') {
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
   * Unescape characters
   * @param string
   */
  static unescapeCharacters = (str: string): string => {
    return he.decode(str)
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
  static formatDate(dateString: EDate) {
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
   * @param objectSets
   */
  static checkSetHidden(data, objectSets) {
    if (!(data?.sets.length > 0) || !objectSets) {
      return false
    }

    return !objectSets.some((set) => !set.hidden && data.sets.includes(set.id))
  }

  /**
   * this function probably should not exist
   **/
  static pushOrCreate(obj, index, value) {
    if (obj[index]) {
      obj[index].push(value)
    } else {
      obj[index] = [value]
    }
  }

  /**
   * implements the cantor pairing algo
   * @todo
   * why though?...Needs a closer look but the usecase in outcomes looks like a mis-analysis
   * adding unneeded complexity
   *
   * @param k1
   * @param k2
   */
  static cantorPairing(k1, k2) {
    return parseInt(((k1 + k2) * (k1 + k2 + 1)) / 2 + k2)
  }

  /**
   * // @todo this is a mistake to include a react helper  here, this means it should be a hook probably
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

  /*******************************************************
   *  thin wrap console log, just to make it easier to track intention of
   *  temp console logs for debugging
   *  versus permanent logger functions
   *******************************************************/
  static logger(...data: any[]) {
    return
    const stack = new Error().stack
    const caller = stack?.split('\n')[2]?.trim() // Get the second item in the stack trace, which is the caller

    console.log(`[Caller: ${caller}]`, ...data)
  }
}

export default Utility

/**
 * thin wrapper around the global django
 * @param str
 */
export const _t = (str: string) => {
  // used to return django gettext helper but we don't use that any more
  return str
}
