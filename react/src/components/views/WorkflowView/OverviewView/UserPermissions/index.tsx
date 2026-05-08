import {
  listProjectTeamOptions,
  listProjectTeamQueryKey,
  updateProjectTeamMemberMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import type { ProjectTeamMemberOut } from '@cf/api/gen/types.gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { useTeamProjectUuidForWorkflow } from '@cf/hooks/useTeamProjectUuidForWorkflow'
import { PermissionGroup } from '@cf/types/common'
import { WorkspaceType } from '@cf/types/enum'
import { permissionGroupMenuOptions } from '@cf/utility/permissions'
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
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { useCallback } from 'react'
import { useParams } from 'react-router-dom'

import * as SC from '../styles'

type PropsType = {
  /** Project UUID (v2 API) when listing/updating project team members. */
  workspaceId: string
  workspaceType: WorkspaceType
  author: EUser
}

function roleToPermissionGroup(
  role: ProjectTeamMemberOut['role']
): PermissionGroup {
  switch (role) {
    case 'editor':
      return PermissionGroup.EDIT
    case 'commenter':
      return PermissionGroup.COMMENT
    case 'viewer':
      return PermissionGroup.VIEW
    default:
      return PermissionGroup.VIEW
  }
}

function permissionGroupToRole(
  group: PermissionGroup
): 'editor' | 'commenter' | 'viewer' {
  switch (group) {
    case PermissionGroup.EDIT:
      return 'editor'
    case PermissionGroup.COMMENT:
      return 'commenter'
    case PermissionGroup.VIEW:
      return 'viewer'
    default:
      return 'viewer'
  }
}

function memberDisplayName(m: ProjectTeamMemberOut): string {
  const name = [m.userFirstName, m.userLastName]
    .filter(Boolean)
    .join(' ')
    .trim()
  return name.length ? name : m.userEmail
}

const UserPermissions = ({ workspaceId, workspaceType, author }: PropsType) => {
  const { onError, onSuccess } = useGenericMsgHandler()
  const { dispatch } = useDialog()
  const queryClient = useQueryClient()
  const { uuid: routeWorkflowUuid } = useParams()

  const { data: workflowTeamProjectUuid } = useTeamProjectUuidForWorkflow(
    workspaceType === WorkspaceType.WORKFLOW ? routeWorkflowUuid : undefined
  )

  const projectUuidForTeam =
    workspaceType === WorkspaceType.PROJECT
      ? workspaceId
      : (workflowTeamProjectUuid ?? null)

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

  function onSuccessHandler(resp: EmptyPostResp) {
    onSuccess(resp)
  }

  async function onChangeHandler(group: PermissionGroup, membershipId: number) {
    if (!projectUuidForTeam) {
      return
    }
    try {
      const resp = await updateMember.mutateAsync({
        path: {
          uuid: projectUuidForTeam,
          membership_uuid: membershipId
        },
        body: { role: permissionGroupToRole(group) }
      })
      onSuccessHandler(resp as unknown as EmptyPostResp)
    } catch (err) {
      onError(err)
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
          <SC.PermissionThumbnail key={user.uuid}>
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
            <MenuButton
              // TODO: this needs to be a check on call to see if current user can edit
              disabled={false}
              options={[
                ...permissionGroupMenuOptions.map((item) => ({
                  name: String(item.value),
                  label:
                    item.label +
                    (roleToPermissionGroup(user.role) === item.value
                      ? ' ' + '(current)'
                      : ''),
                  disabled: roleToPermissionGroup(user.role) === item.value
                })),
                {
                  name: 'mui-divider'
                },
                {
                  name: 'remove',
                  label: _t('Remove user'),
                  onClick: onUserRemove(user.uuid, memberDisplayName(user))
                }
              ]}
              onChange={(group) =>
                onChangeHandler(Number(group) as PermissionGroup, user.uuid)
              }
              placeholder={
                permissionGroupMenuOptions.find(
                  (p) => p.value === roleToPermissionGroup(user.role)
                )?.label || 'Choose Permissions (user should never see this)'
              }
            />
          </SC.PermissionThumbnail>
        ))}

        <SC.PermissionThumbnail addNew as={Button} onClick={onUserAdd}>
          <ListItemAvatar>
            <Avatar>
              <PersonAddAlt1Icon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary={_t('Add CourseFlow user')} />
        </SC.PermissionThumbnail>
      </SC.PermissionGrid>
    </SC.InfoBlockContent>
  )
}

export default UserPermissions
