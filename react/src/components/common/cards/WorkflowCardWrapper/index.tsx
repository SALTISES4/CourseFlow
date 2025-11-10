import useNavigateToLibraryItem from '@cf/hooks/useNavigateToLibraryItem'
import { LibraryObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import Favourite from '@cfComponents/UIPrimitives/Favourite'
import { workflowTitle } from '@cfComponents/UIPrimitives/Titles.ts'
import ErrorIcon from '@mui/icons-material/Error'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import WorkflowCardDumb, {
  PropsType as WorkflowCardDumbPropsType
} from '../WorkflowCardDumb'

/*******************************************************
 * A workflow card for a menu
 *
 *******************************************************/

export type WorkflowCardWrapperPropsType = Pick<
  WorkflowCardDumbPropsType,
  'id' | 'description' | 'chips'
> & {
  title: string
  isFavourite: boolean
  isLinked: boolean
  type: LibraryObjectType
  isSelected?: boolean
  onClick?: () => void
}
const WorkflowCardWrapper = ({
  id,
  title,
  description,
  chips,
  isFavourite,
  type,
  isLinked,
  isSelected = false,
  onClick
}: WorkflowCardWrapperPropsType) => {
  /******************************************E*************
   * FUNCTIONS
   *******************************************************/
  const navigateToItem = useNavigateToLibraryItem()

  const Extras = () =>
    isLinked ? (
      <Tooltip
        className="linked-workflow-warning"
        placement="top"
        arrow
        title={_t(
          'Warning: linking the same workflow to multiple nodes can result in loss of readability if you are associating parent workflow outcomes with child workflow outcomes.'
        )}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'flex-start'
          }}
        >
          <IconButton color="secondary" size="small">
            <ErrorIcon sx={{ color: 'error.main' }} />
          </IconButton>
          <Typography variant="body2">{_t('Already in use')}</Typography>
        </Box>
      </Tooltip>
    ) : null

  /*******************************************************
   * RENDER
   *******************************************************/
  // @todo
  // const isDisabledLink = noHyperlink
  const isDisabledLink = false

  // @todo
  const code = ''
  const deleted = false

  const favourite = <Favourite id={id} isFavourite={isFavourite} type={type} />

  return (
    <WorkflowCardDumb
      id={id}
      title={workflowTitle({ title, code, deleted })}
      favourite={favourite}
      isDisabledLink={isDisabledLink}
      description={description}
      isSelected={isSelected}
      // overridden onclick handler
      onClick={onClick ? () => onClick() : () => navigateToItem(id, type)}
      chips={chips}
      footer={<Extras />}
    />
  )
}

export default WorkflowCardWrapper
