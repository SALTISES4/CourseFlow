import { LibraryContentTypeOut } from '@cf/api/gen'
import useNavigateToLibraryItem from '@cf/hooks/useNavigateToLibraryItem'
import { _t } from '@cf/utility/Utility.class'
import WorkflowCardDumb, {
  PropsType as WorkflowCardDumbPropsType
} from '@cfComponents/cards/WorkflowCardDumb'
import Favorite from '@cfComponents/UIPrimitives/Favourite'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import Tooltip from '@mui/material/Tooltip'

import { workflowTitle } from '../../UIPrimitives/Titles'
import { CardChip as WorkflowCardChip } from '../WorkflowCardDumb/styles'

/*******************************************************
 * A workflow card for a menu
 *******************************************************/

export type WorkflowCardWrapperPropsType = Pick<
  WorkflowCardDumbPropsType,
  'uuid' | 'description' | 'chips' | 'isSelected' | 'onClick'
> & {
  title: string
  isFavorite: boolean
  isLinked: boolean
  type: LibraryContentTypeOut
}

const WorkflowCardWrapper = ({
  uuid,
  title,
  description,
  chips,
  type,
  isFavorite,
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

  return (
    <WorkflowCardDumb
      uuid={uuid}
      data-test-id={
        type === LibraryContentTypeOut.PROJECT
          ? 'project-card'
          : 'workflow-card'
      }
      title={workflowTitle({ title, code, deleted })}
      favorite={<Favorite uuid={uuid} isFavorite={isFavorite} />}
      isDisabledLink={isDisabledLink}
      description={description}
      isSelected={isSelected}
      onClick={onClick ? onClick : () => navigateToItem(uuid, type)}
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
