import { LibraryContentTypeOut, type PermissionContextOut } from '@cf/api/gen'
import Favorite from '@cf/components/common/UIPrimitives/Favorite'
import useNavigateToLibraryItem from '@cf/hooks/useNavigateToLibraryItem'
import WorkflowCardDumb, {
  ChipOptions,
  PropsType as WorkflowCardDumbPropsType
} from '@cfComponents/cards/WorkflowCardDumb'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import Tooltip from '@mui/material/Tooltip'
import { useTranslation } from 'react-i18next'

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
  editLockHolderName?: string | null
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
  editLockHolderName,
  isSelected = false,
  onClick
}: WorkflowCardWrapperPropsType) => {
  const { t } = useTranslation('common')
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
      title={workflowTitle({
        title,
        code,
        deleted,
        fallbackText: t('labels.untitled'),
        deletedText: t('labels.deletedSuffix')
      })}
      favorite={actions}
      isDisabledLink={isDisabledLink}
      description={
        ownerName ? t('cards.ownedBy', { name: ownerName }) : undefined
      }
      isSelected={isSelected}
      onClick={onClick ? onClick : () => navigateToItem(uuid, type)}
      chips={[
        ...chips,
        isArchived && {
          type: ChipOptions.ARCHIVED,
          label: t('labels.archived')
        },
        editLockHolderName && (
          <EditLockChip
            key="edit-lock"
            holderDisplayName={editLockHolderName}
          />
        ),
        isLinked && <InUseChip key="in-use" />
      ]}
    />
  )
}

const EditLockChip = ({ holderDisplayName }: { holderDisplayName: string }) => {
  const { t } = useTranslation('common')

  return (
    <WorkflowCardChip
      data-testid="card-edit-lock"
      sx={{
        border: 0,
        backgroundColor: '#eef2fd',
        '& .MuiChip-icon': {
          color: 'inherit',
          fontSize: '16px',
          marginLeft: '6px'
        }
      }}
      icon={<LockRoundedIcon />}
      label={t('editLock.currentlyEditing', {
        displayName: holderDisplayName
      })}
      variant="outlined"
    />
  )
}

const InUseChip = () => {
  const { t } = useTranslation('common')

  return (
    <Tooltip
      className="linked-workflow-warning"
      placement="top"
      arrow
      title={t('cards.linkedWorkflowWarning')}
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
        label={t('cards.alreadyInUse')}
        variant="outlined"
      />
    </Tooltip>
  )
}

export default WorkflowCardWrapper
