import { OuterContentWrap } from '@cf/mui/helper'
import Stack from '@mui/material/Stack'
import { ReactElement } from 'react'

import * as Styled from './styles'

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
 * there is room to make this more flex, i.e. left, middle etc sections should be just layout wrappers that content gets assigned to
 */
const MenuBar = ({ leftSection, viewbar, userbar }: PropsType) => {
  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <Styled.Wrapper>
      <OuterContentWrap>
        <Styled.Inner>
          <div data-test-id="actions-bar" style={{ display: 'flex' }}>
            {leftSection}
          </div>
          <Stack direction="row" spacing={2}>
            <div data-test-id="user-bar">{userbar}</div>
            <div data-test-id="viewbar">{viewbar}</div>
          </Stack>
        </Styled.Inner>
      </OuterContentWrap>
    </Styled.Wrapper>
  )
}
export default MenuBar
