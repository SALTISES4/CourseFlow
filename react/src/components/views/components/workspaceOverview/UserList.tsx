import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { PermissionGroup } from '@cf/types/common'
import { WorkspaceType } from '@cf/types/enum'
import { permissionGroupMenuOptions } from '@cf/utility/permissions'
import { getInitials } from '@cf/utility/utilityFunctions'
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
import React from 'react'

import * as SC from './styles'

/**
 *
 * Gets the list of every user and their permission group for management
 * Can be used for both projects and workflows ('workspace' object)
 * see: https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow---V2?node-id=3566-42791&node-type=frame&t=g3Bcy86xsBXtIG9U-0
 *
 * @param workspaceId
 * @param author
 * @constructor
 */
const UserList = ({
  workspaceId,
  workspaceType,
  author
}: {
  workspaceId: number
  workspaceType: WorkspaceType
  author: EUser
}) => {
  const { onError, onSuccess } = useGenericMsgHandler()
  const { dispatch } = useDialog()

  /*******************************************************
   * QUERIES
   *******************************************************/
  const { data, error, isLoading, isError, refetch } =
    useGetUsersForObjectQuery({
      id: workspaceId,
      payload: {
        objectType: workspaceType
      }
    })

  // console.log({ workspaceType })
  // console.log({ data })

  const [mutate, { isError: isMutateError, error: mutateError, isSuccess }] =
    useWorkspaceUserUpdateMutation()

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

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

  if (!data || isLoading) return <></>

  return (
    <SC.InfoBlockContent>
      <List>
        <SC.PermissionThumbnail>
          <ListItemAvatar>
            <Avatar alt={author.firstName}>
              {getInitials(author.firstName)}
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary={author.firstName} secondary={author.email} />
          <Button disabled>owner</Button>
        </SC.PermissionThumbnail>

        {data.dataPackage.map((user) => {
          return (
            <SC.PermissionThumbnail key={user.id}>
              <ListItemAvatar>
                <Avatar alt={user.firstName}>{getInitials(user.name)}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={user.username} secondary={user.email} />
              <MenuButton
                disabled={false} // this needs to be a check on call to see if current user can edit
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
                        userName: user.name
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

export default UserList
