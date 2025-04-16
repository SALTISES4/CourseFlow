import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import ChatIcon from '@mui/icons-material/Chat'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

type PropsType = {
  show: boolean
}

import * as Styled from './styles'

const HoverMenu = ({ show }: PropsType) => {
  return (
    <Styled.Wrap show={show}>
      <Tooltip placement="top" arrow title="Insert node below">
        <IconButton color="secondary" size="small">
          <AddCircleOutlineIcon />
        </IconButton>
      </Tooltip>
      <Tooltip placement="top" arrow title="Duplicate node below">
        <IconButton color="secondary" size="small">
          <ContentCopyIcon />
        </IconButton>
      </Tooltip>
      <Tooltip placement="top" arrow title="Delete node">
        <IconButton color="secondary" size="small">
          <DeleteIcon />
        </IconButton>
      </Tooltip>
      <IconButton color="secondary" size="small">
        <ChatIcon />
      </IconButton>
    </Styled.Wrap>
  )
}

export default HoverMenu
