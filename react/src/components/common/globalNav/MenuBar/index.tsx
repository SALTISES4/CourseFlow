import { styled } from '@mui/material/styles'
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

const SCMenubar = styled('div')(({ theme }) => ({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#E2F5EB',
  color: theme.palette.primary.main
}))

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
