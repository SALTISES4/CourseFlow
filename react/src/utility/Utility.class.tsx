import { EDate } from '@XMLHTTP/types/entity'

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

  /*******************************************************
   *  thin wrap console log, just to make it easier to track intention of
   *  temp console logs for debugging
   *  versus permanent logger functions
   *******************************************************/
  static logger(...args: any[]) {
    console.log(...args)
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

export const getNextLargestNumber = (haystack: number[]): number => {
  const largest = haystack.reduce((acc, curr) => {
    return acc > curr ? acc : curr
  }, 0)

  return largest + 1
}
