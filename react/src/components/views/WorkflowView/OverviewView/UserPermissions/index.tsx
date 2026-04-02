import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
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
import { EUser } from '@XMLHTTP/types/entity'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { useCallback } from 'react'

import * as SC from '../styles'

type PropsType = {
  workspaceid: string
  workspaceType: WorkspaceType
  author: EUser
}

const UserPermissions = ({ workspaceId, workspaceType, author }: PropsType) => {
  const { onError, onSuccess } = useGenericMsgHandler()
  const { dispatch } = useDialog()

  const { data, error, isLoading, isError, refetch } =
    useGetUsersForObjectQuery({
      id: workspaceId,
      payload: {
        objectType: workspaceType
      }
    })

  // Utility.logger({ workspaceType })
  // Utility.logger({ data })

  const [mutate, { isError: isMutateError, error: mutateError, isSuccess }] =
    useWorkspaceUserUpdateMutation()

  function onSuccessHandler(resp: EmptyPostResp) {
    onSuccess(resp)
    refetch()
  }

  async function onChangeHandler(group: PermissionGroup, userid: string) {
    const args = {
      id: workspaceId,
      payload: {
        userId,
        type: WorkspaceType.PROJECT,
        group
      }
    }
    try {
      const resp = await mutate(args).unwrap()
      onSuccessHandler(resp)
    } catch (err) {
      onError(err)
    }
  }

  const onUserAdd = useCallback(() => {
    dispatch(DialogMode.CONTRIBUTOR_ADD)
  }, [dispatch])

  const onUserRemove = useCallback(
    (userid: string, username: string) => {
      return () => {
        dispatch(DialogMode.CONTRIBUTOR_REMOVE, {
          userId,
          username
        })
      }
    },
    [dispatch]
  )

  if (!data || isLoading) {
    return <></>
  }

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

        {data.dataPackage.map((user) => (
          <SC.PermissionThumbnail key={user.id}>
            <ListItemAvatar>
              <Avatar alt={user.name}>
                {ThemeHelper.getInitials(
                  user.name.trim().length > 2 ? user.name.trim() : user.username
                ).toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={user.name.trim().length ? user.name : user.username}
              secondary={author.email}
            />
            <MenuButton
              // TODO: this needs to be a check on call to see if current user can edit
              disabled={false}
              options={[
                ...permissionGroupMenuOptions.map((item) => ({
                  name: String(item.value),
                  label:
                    item.label +
                    (user.group === item.value ? ' ' + '(current)' : ''),
                  disabled: user.group === item.value
                })),
                {
                  name: 'mui-divider'
                },
                {
                  name: 'remove',
                  label: _t('Remove user'),
                  onClick: onUserRemove(user.id, user.username)
                }
              ]}
              onChange={(group) =>
                onChangeHandler(Number(group) as PermissionGroup, user.id)
              }
              placeholder={
                permissionGroupMenuOptions.find((p) => p.value === user.group)
                  ?.label || 'Choose Permissions (user should never see this)'
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
