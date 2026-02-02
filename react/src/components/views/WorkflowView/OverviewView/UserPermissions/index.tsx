import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { PermissionGroup } from '@cf/types/common'
import { WorkspaceType } from '@cf/types/enum'
import { permissionGroupMenuOptions } from '@cf/utility/permissions'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import MenuButton from '@cfComponents/menu/MenuButton'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import {
  useGetUsersForObjectQuery,
  useWorkspaceUserUpdateMutation
} from '@XMLHTTP/API/workspaceUser.rtk'
import { EUser } from '@XMLHTTP/types/entity'
import { EmptyPostResp } from '@XMLHTTP/types/query'

import * as SC from '../styles'

type PropsType = {
  workspaceId: number
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

  async function onChangeHandler(group: PermissionGroup, userId: number) {
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

  if (!data || isLoading) {
    return <></>
  }

  return (
    <SC.InfoBlockContent>
      <List>
        {author && (
          <SC.PermissionThumbnail>
            <ListItemAvatar>
              <Avatar alt={author.firstName}>
                {ThemeHelper.getInitials(author.firstName)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={author.firstName} secondary={author.email} />
            <Button disabled>{_t('owner')}</Button>
          </SC.PermissionThumbnail>
        )}

        {data.dataPackage.map((user) => {
          return (
            <SC.PermissionThumbnail key={user.id}>
              <ListItemAvatar>
                <Avatar alt={user.firstName}>
                  {ThemeHelper.getInitials(user.name)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={user.username} secondary={user.email} />
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
                    label: 'Remove user',
                    onClick: () => {
                      dispatch(DialogMode.CONTRIBUTOR_REMOVE, {
                        userId: user.id,
                        username: user.name
                      })
                    }
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
          )
        })}
      </List>
    </SC.InfoBlockContent>
  )
}

export default UserPermissions
