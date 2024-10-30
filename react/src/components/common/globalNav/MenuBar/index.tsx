import { styled } from '@mui/material/styles'
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
  legendbar?: ReactElement
}
const colorWhiteGreen = '#E8F5E9' // Example color, replace with the actual color code

const SCMenubar = styled('div')`
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-family: 'Open Sans', sans-serif;
  align-items: center;
  background: ${colorWhiteGreen};
  box-sizing: border-box;
`
/**
 * there is room to make this more flex, i.e. left, middle etc sections should be just layout wrappers that content gets assigned to
 */
const MenuBar = ({ leftSection, viewbar, userbar, legendbar }: PropsType) => {
  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <SCMenubar>
      <div data-test-id="actions-bar" style={{ display: 'flex' }}>
        {leftSection}
      </div>
      <div data-test-id="user-bar">{userbar}</div>
      <div data-test-id="viewbar">{viewbar}</div>
      <div data-test-id="legend-bar">{legendbar}</div>
    </SCMenubar>
  )
}
export default MenuBar
