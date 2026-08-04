import { LibraryContentTypeOut, type PermissionContextOut } from '@cf/api/gen'
import Favorite from '@cf/components/common/UIPrimitives/Favorite'
import useNavigateToLibraryItem from '@cf/hooks/useNavigateToLibraryItem'
import { _t } from '@cf/utility/Utility.class'
import WorkflowCardDumb, {
  ChipOptions,
  PropsType as WorkflowCardDumbPropsType
} from '@cfComponents/cards/WorkflowCardDumb'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import Tooltip from '@mui/material/Tooltip'

import LibraryLifecycleActions from './LibraryLifecycleActions'
import { workflowTitle } from '../../UIPrimitives/Titles'
import { CardChip as WorkflowCardChip } from '../WorkflowCardDumb/styles'

/*******************************************************
 * A workflow card for a menu
 *******************************************************/

export type WorkflowCardWrapperPropsType = Pick<
  WorkflowCardDumbPropsType,
  'uuid' | 'chips' | 'isSelected' | 'onClick'
> & {
  title: string
  ownerName?: string | null
  isFavorite: boolean
  isLinked: boolean
  type: LibraryContentTypeOut
  isArchived?: boolean
  permissions?: PermissionContextOut
  projectUuid?: string | null
  projectIsArchived?: boolean | null
}

const WorkflowCardWrapper = ({
  uuid,
  title,
  ownerName,
  chips,
  type,
  isFavorite,
  isLinked,
  isArchived = false,
  permissions,
  projectUuid,
  projectIsArchived,
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
  const isDisabledLink = isArchived

  // @todo
  const code = ''
  const deleted = isArchived

  const actions =
    isArchived && permissions ? (
      <LibraryLifecycleActions
        uuid={uuid}
        type={type}
        permissions={permissions}
        projectUuid={projectUuid}
        projectIsArchived={projectIsArchived}
      />
    ) : (
      <Favorite uuid={uuid} isFavorite={isFavorite} />
    )

  return (
    <WorkflowCardDumb
      uuid={uuid}
      data-test-id={
        type === LibraryContentTypeOut.PROJECT
          ? 'project-card'
          : 'workflow-card'
      }
      title={workflowTitle({ title, code, deleted })}
      favorite={actions}
      isDisabledLink={isDisabledLink}
      description={ownerName ? `${_t('Owned by')} ${ownerName}` : undefined}
      isSelected={isSelected}
      onClick={onClick ? onClick : () => navigateToItem(uuid, type)}
      chips={[
        ...chips,
        isArchived && { type: ChipOptions.ARCHIVED, label: _t('Archived') },
        isLinked && <InUseChip key="in-use" />
      ]}
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
