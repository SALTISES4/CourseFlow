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

export const capitalize = (text: string) => {
  if (!text) {
    return ''
  }

  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const getNextLargestNumber = (haystack: number[]): number => {
  const largest = haystack.reduce((acc, curr) => {
    return acc > curr ? acc : curr
  }, 0)

  return largest + 1
}
