import { _t } from '@cf/utility/Utility.class'

import { SidebarContent, SidebarInnerWrap, SidebarTitle } from '../../styles'

const CommentsTab = () => {
  return (
    <SidebarInnerWrap>
      <SidebarContent>
        <SidebarTitle as="h3" variant="h6">
          {_t('Comments')}
        </SidebarTitle>
        <h2>Messages go here</h2>
      </SidebarContent>
    </SidebarInnerWrap>
  )
}

export default CommentsTab
