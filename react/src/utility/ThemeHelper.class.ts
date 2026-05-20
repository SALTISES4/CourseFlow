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

  /**
   * capitalize first letter of each word in a string
   * @param str
   */
  static capWords(str: string | undefined): string {
    if (!str) {
      return ''
    }

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

  /*******************************************************
   * UI
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

  static decimalToHex(val: number): string {
    return '#' + ('000000' + val?.toString(16)).slice(-6)
  }
}

export default ThemeHelper
