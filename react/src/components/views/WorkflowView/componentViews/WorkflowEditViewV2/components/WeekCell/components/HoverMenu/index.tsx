import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import ChatIcon from '@mui/icons-material/Chat'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import { useCallback } from 'react'

type PropsType = {
  show: boolean
}

const HoverMenu = ({ show }: PropsType) => {
  const onActionClick = useCallback((action: string) => {
    return () => {
      console.log('clicked', action)
    }
  }, [])

  return (
    <NodeHoverMenu
      show={show}
      items={[
        {
          label: 'Insert node below',
          icon: <AddCircleOutlineIcon />,
          onClick: onActionClick('Insert')
        },
        {
          label: 'Duplicate node below',
          icon: <ContentCopyIcon />,
          onClick: onActionClick('Duplicate')
        },
        {
          label: 'Delete node',
          icon: <DeleteIcon />,
          onClick: onActionClick('Delete')
        },
        {
          label: 'Comments',
          icon: <ChatIcon />,
          onClick: onActionClick('Comments')
        }
      ]}
    />
  )
}

export default HoverMenu
