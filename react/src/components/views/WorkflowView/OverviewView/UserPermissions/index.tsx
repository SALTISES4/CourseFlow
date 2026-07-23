import {
  listProjectTeamOptions,
  listProjectTeamQueryKey,
  updateProjectTeamMemberMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import type { ProjectTeamMemberOut } from '@cf/api/gen/types.gen'
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
import { _t } from '@cf/utility/Utility.class'
import MenuButton from '@cfComponents/menu/MenuButton'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { EUser } from '@XMLHTTP/types/entity'
import { enqueueSnackbar } from 'notistack'
import { useCallback } from 'react'
import { useParams } from 'react-router-dom'

import * as SC from '../styles'

type PropsType = {
  /** Project UUID (v2 API) when listing/updating project team members. */
  workspaceId: string
  workspaceType: WorkspaceType
  author: EUser
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
  author,
  readOnly = false,
  projectUuid
}: PropsType) => {
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
      enqueueSnackbar(_t("The contributor's role was successfully updated"), {
        variant: SnackbarOptions.SUCCESS
      })
    } catch (err) {
      enqueueSnackbar(
        _t(
          "We encountered an issue and the contributor's role was not updated"
        ),
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

  const members = teamData?.items ?? []

  return (
    <SC.InfoBlockContent>
      <SC.PermissionGrid>
        {author && (
          <SC.PermissionThumbnail>
            <ListItemAvatar>
              <Avatar alt={author.name}>
                {ThemeHelper.getInitials(
                  author.name.trim().length > 2
                    ? author.name.trim()
                    : author.username
                ).toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                author.name.trim().length ? author.name : author.username
              }
              secondary={author.email}
            />
            <Button variant="outlined" disabled>
              {_t('Owner')}
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
                {projectTeamRoleLabel(user.role)}
              </Button>
            ) : (
              <MenuButton
                disabled={!canManageMembers}
                selected={user.role}
                options={[
                  ...projectTeamRoleMenuOptions.map((item) => ({
                    name: item.value,
                    label: item.label,
                    disabled: user.role === item.value
                  })),
                  {
                    name: 'mui-divider'
                  },
                  {
                    name: 'remove',
                    label: _t('Remove contributor'),
                    onClick: onUserRemove(user.id, memberDisplayName(user))
                  }
                ]}
                onChange={(role) =>
                  onChangeHandler(role as ProjectTeamRoleSchema, user.id)
                }
                placeholder={projectTeamRoleLabel(user.role)}
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
            <ListItemText primary={_t('Add CourseFlow user')} />
          </SC.PermissionThumbnail>
        )}
      </SC.PermissionGrid>
    </SC.InfoBlockContent>
  )
}

export default UserPermissions
