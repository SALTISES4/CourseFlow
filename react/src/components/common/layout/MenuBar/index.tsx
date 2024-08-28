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
  visibleButtons: React.ReactElement | React.ReactElement[]
  viewbar?: React.ReactElement
  userbar?: React.ReactElement
  overflowButtons?: React.ReactElement | React.ReactElement[]
}
/**
 *
 */
const MenuBar = (props: PropsType) => {
  const { visibleButtons, viewbar, userbar, overflowButtons } = props
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
  const viewBar = viewbar ?? null
  const userBar = userbar ?? null

  return (
    <div className="menubar">
      <div id="floatbar" className="floatbar">
        {visibleButtons && <div id="visible-icons">{visibleButtons}</div>}
        {overflowButtons && (
          <div id="overflow-options">
            <span className="hover-shade green material-symbols-rounded">
              more_horiz
            </span>

            <div id="overflow-links" className="create-dropdown">
              {overflowButtons}
            </div>
          </div>
        )}
      </div>
      <div id="userbar" className="floatbar">
        {userBar}
      </div>
      <div id="viewbar" className="floatbar">
        {viewBar}
      </div>
    </div>
  )
}
export default MenuBar
