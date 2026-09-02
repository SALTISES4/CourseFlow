import {
  listProjectTeamOptions,
  listProjectTeamQueryKey,
  updateProjectTeamMemberMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import type {
  ProjectTeamMemberOut,
  UserSummaryOut
} from '@cf/api/gen/types.gen'
import { ProjectPermission, ProjectTeamRoleSchema } from '@cf/api/gen/types.gen'
import { useProjectPermission } from '@cf/context/workspacePermissionsContext'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { useTeamProjectUuidForWorkflow } from '@cf/hooks/useTeamProjectUuidForWorkflow'
import { WorkspaceType } from '@cf/types/enum'
import { SnackbarOptions } from '@cf/utility/constants'
import {
  projectTeamRoleLabel,
  projectTeamRoleMenuOptions
} from '@cf/utility/permissions'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import MenuButton from '@cfComponents/menu/MenuButton'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import * as SC from '../styles'

type PropsType = {
  /** Project UUID (v2 API) when listing/updating project team members. */
  workspaceId: string
  workspaceType: WorkspaceType
  owner: UserSummaryOut
  readOnly?: boolean
  projectUuid?: string | null
}

function memberDisplayName(m: ProjectTeamMemberOut): string {
  const name = [m.userFirstName, m.userLastName]
    .filter(Boolean)
    .join(' ')
    .trim()
  return name.length ? name : m.userEmail
}

const UserPermissions = ({
  workspaceId,
  workspaceType,
  owner,
  readOnly = false,
  projectUuid
}: PropsType) => {
  const { t } = useTranslation('workflow')
  const { t: tWorkspace } = useTranslation('workspace')
  const { dispatch } = useDialog()
  const queryClient = useQueryClient()
  const { uuid: routeWorkflowUuid } = useParams()
  const hasManageMembersPermission = useProjectPermission(
    ProjectPermission.MANAGE_MEMBERS
  )
  const canManageMembers = !readOnly && hasManageMembersPermission

  const { data: workflowTeamProjectUuid } = useTeamProjectUuidForWorkflow(
    workspaceType === WorkspaceType.WORKFLOW && !projectUuid
      ? routeWorkflowUuid
      : undefined
  )

  const projectUuidForTeam =
    workspaceType === WorkspaceType.PROJECT
      ? workspaceId
      : (projectUuid ?? workflowTeamProjectUuid ?? null)

  const { data: teamData, isLoading } = useQuery({
    ...listProjectTeamOptions({
      path: { uuid: projectUuidForTeam! }
    }),
    enabled: Boolean(projectUuidForTeam)
  })

  const updateMember = useMutation({
    ...updateProjectTeamMemberMutation(),
    onSuccess: async () => {
      if (projectUuidForTeam) {
        await queryClient.invalidateQueries({
          queryKey: listProjectTeamQueryKey({
            path: { uuid: projectUuidForTeam }
          })
        })
      }
    }
  })

  async function onChangeHandler(
    role: ProjectTeamRoleSchema,
    membershipId: number
  ) {
    if (!projectUuidForTeam || !canManageMembers) {
      return
    }
    try {
      await updateMember.mutateAsync({
        path: {
          uuid: projectUuidForTeam,
          membership_id: membershipId
        },
        body: { role }
      })
      enqueueSnackbar(t('messages.roleUpdated'), {
        variant: SnackbarOptions.SUCCESS
      })
    } catch (err) {
      enqueueSnackbar(
        t('messages.roleUpdateFailed'),
        { variant: SnackbarOptions.ERROR }
      )
      console.error('Failed to update contributor role:', err)
    }
  }

  const onUserAdd = useCallback(() => {
    dispatch(DialogMode.CONTRIBUTOR_ADD)
  }, [dispatch])

  const onUserRemove = useCallback(
    (membershipId: number, username: string) => {
      return () => {
        dispatch(DialogMode.CONTRIBUTOR_REMOVE, {
          membershipId,
          username
        })
      }
    },
    [dispatch]
  )

  if (!projectUuidForTeam || isLoading) {
    return <></>
  }

  const members =
    teamData?.items.filter((u) => u.userEmail !== owner.email) ?? []

  return (
    <SC.InfoBlockContent>
      <SC.PermissionGrid>
        {owner && (
          <SC.PermissionThumbnail>
            <ListItemAvatar>
              <Avatar alt={owner.firstName}>
                {ThemeHelper.getInitials(
                  `${owner.firstName} ${owner.lastName}`
                ).toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={`${owner.firstName} ${owner.lastName}`}
              secondary={owner.email}
            />
            <Button variant="outlined" disabled>
              {t('permissions.owner')}
            </Button>
          </SC.PermissionThumbnail>
        )}

        {members.map((user) => (
          <SC.PermissionThumbnail key={user.id}>
            <ListItemAvatar>
              <Avatar alt={memberDisplayName(user)}>
                {ThemeHelper.getInitials(
                  memberDisplayName(user).trim().length > 2
                    ? memberDisplayName(user).trim()
                    : user.userEmail
                ).toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={memberDisplayName(user)}
              secondary={user.userEmail}
            />
            {readOnly ? (
              <Button variant="outlined" disabled>
                {projectTeamRoleLabel(user.role, tWorkspace)}
              </Button>
            ) : (
              <MenuButton
                disabled={!canManageMembers}
                selected={user.role}
                options={[
                  ...projectTeamRoleMenuOptions(tWorkspace).map((item) => ({
                    name: item.value,
                    label: item.label,
                    disabled: user.role === item.value
                  })),
                  {
                    name: 'mui-divider'
                  },
                  {
                    name: 'remove',
                    label: t('permissions.removeContributor'),
                    onClick: onUserRemove(user.id, memberDisplayName(user))
                  }
                ]}
                onChange={(role) =>
                  onChangeHandler(role as ProjectTeamRoleSchema, user.id)
                }
                placeholder={projectTeamRoleLabel(user.role, tWorkspace)}
              />
            )}
          </SC.PermissionThumbnail>
        ))}

        {canManageMembers && (
          <SC.PermissionThumbnail addNew as={Button} onClick={onUserAdd}>
            <ListItemAvatar>
              <Avatar>
                <PersonAddAlt1Icon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={t('permissions.addUser')} />
          </SC.PermissionThumbnail>
        )}
      </SC.PermissionGrid>
    </SC.InfoBlockContent>
  )
}

export default UserPermissions
