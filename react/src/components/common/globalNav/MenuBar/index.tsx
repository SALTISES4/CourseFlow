import * as React from 'react'
import { useEffect } from 'react'

/**
 * Creates a menu bar at the top of the page which can be passed
 * various links, buttons and other buttons.
 *
 * MenuBar is a thin wrapper, and shows up in multiple pages and views
 * Different components compose content for menu bar and pass them in as props
 */

type PropsType = {
  leftSection: React.ReactElement
  viewbar?: React.ReactElement
  userbar?: React.ReactElement
  overflowButtons?: React.ReactElement | React.ReactElement[]
}
/**
 *
 */
const MenuBar = (props: PropsType) => {
  const { leftSection, viewbar, userbar, overflowButtons } = props
  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  useEffect(() => {
    dropdownOverflow()
  }, [])

  useEffect(() => {
    dropdownOverflow()
  }, [props])

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  const dropdownOverflow = () => {
    COURSEFLOW_APP.makeDropdown('#overflow-options', '#overflow-links')
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <div className="menubar">
      <div id="floatbar" className="floatbar">
        {leftSection}
      </div>
      <div id="userbar" className="floatbar">
        {userbar}
      </div>
      <div id="viewbar" className="floatbar">
        {viewbar}
      </div>
    </div>
  )
}
export default MenuBar
