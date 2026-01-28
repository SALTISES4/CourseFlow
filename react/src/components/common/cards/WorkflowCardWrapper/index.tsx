import useNavigateToLibraryItem from '@cf/hooks/useNavigateToLibraryItem'
import { LibraryObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import Favourite from '@cfComponents/UIPrimitives/Favourite'
import { workflowTitle } from '@cfComponents/UIPrimitives/Titles.ts'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import Tooltip from '@mui/material/Tooltip'

import WorkflowCardDumb, {
  PropsType as WorkflowCardDumbPropsType
} from '../WorkflowCardDumb'
import { CardChip as WorkflowCardChip } from '../WorkflowCardDumb/styles'

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
      onClick={onClick ? onClick : () => navigateToItem(id, type)}
      chips={[...chips, isLinked && <InUseChip key="in-use" />]}
    />
  )
}

const InUseChip = () => (
  <Tooltip
    className="linked-workflow-warning"
    placement="top"
    arrow
    title={_t(
      'Warning: linking the same workflow to multiple nodes can result in loss of readability if you are associating parent workflow outcomes with child workflow outcomes.'
    )}
  >
    <WorkflowCardChip
      color="warning"
      sx={{
        paddingLeft: '2px',
        border: 0,
        backgroundColor: '#fff4e5',
        '& .MuiChip-label': {
          color: '#663C00'
        }
      }}
      icon={<WarningAmberRoundedIcon sx={{ marginLeft: '2px' }} />}
      label={_t('Already in use')}
      variant="outlined"
    />
  </Tooltip>
)

export default WorkflowCardWrapper
