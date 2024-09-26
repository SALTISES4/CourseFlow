import * as React from 'react'
import { ReactElement } from 'react'

/**
 * Creates a menu bar at the top of the page which can be passed
 * various links, buttons and other buttons.
 *
 * MenuBar is a thin wrapper, and shows up in multiple pages and views
 * Different components compose content for menu bar and pass them in as props
 */

type PropsType = {
  leftSection: ReactElement
  viewbar?: ReactElement
  userbar?: ReactElement
}
/**
 *
 */
const MenuBar = ({ leftSection, viewbar, userbar }: PropsType) => {
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
