import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { OuterContentWrap } from '@cf/mui/helper'
import { PermissionGroup, ProjectDetailsType } from '@cf/types/common'
import { WorkspaceType } from '@cf/types/enum'
import { permissionGroupMenuOptions } from '@cf/utility/permissions'
import { _t, getInitials } from '@cf/utility/utilityFunctions'
import MenuButton from '@cfComponents/menu/MenuButton'
import LinkIcon from '@mui/icons-material/Link'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import List from '@mui/material/List'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
  UsersForObjectQueryResp,
  useGetUsersForObjectQuery,
  useWorkspaceUserUpdateMutation
} from '@XMLHTTP/API/workspaceUser.rtk'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import React from 'react'
import { useParams } from 'react-router-dom'

import {
  InfoBlock,
  InfoBlockContent,
  InfoBlockTitle,
  ObjectSetThumbnail,
  PermissionThumbnail
} from './styles'

const OverviewTab = ({
  description,
  disciplines,
  created,
  objectSets,
  author
}: ProjectDetailsType) => {
  const { dispatch } = useDialog()
  const { id } = useParams()
  const projectId = Number(id)
  const { onError, onSuccess } = useGenericMsgHandler()

  /*******************************************************
   * QUERIES
   *******************************************************/
  const { data, error, isLoading, isError } = useGetUsersForObjectQuery({
    id: projectId,
    payload: {
      objectType: WorkspaceType.PROJECT
    }
  })
  const [mutate, { isError: isMutateError, error: mutateError, isSuccess }] =
    useWorkspaceUserUpdateMutation()

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  function onSuccessHandler(resp: EmptyPostResp) {
    onSuccess(resp)
  }
  async function onChangeHandler(group: PermissionGroup, userId: number) {
    const args = {
      id: projectId,
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
  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const Users = ({ data }: { data: UsersForObjectQueryResp }) => {
    if (!data || isLoading) return <></>

    return (
      <InfoBlockContent>
        <List>
          <PermissionThumbnail>
            <ListItemAvatar>
              <Avatar alt={author.firstName}>
                {getInitials(author.firstName)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={author.firstName} secondary={author.email} />
            <Button disabled>owner</Button>
          </PermissionThumbnail>

          {data.dataPackage.map((user) => {
            console.log(user)
            return (
              <PermissionThumbnail key={user.id}>
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
                    permissionGroupMenuOptions.find(
                      (p) => p.value === user.group
                    )?.label ||
                    'Choose Permissions (user should never see this)'
                  }
                />
              </PermissionThumbnail>
            )
          })}
        </List>
      </InfoBlockContent>
    )
  }

  const ObjectSets = () => {
    if (!objectSets) return <></>
    return (
      <InfoBlock sx={{ mt: 3 }}>
        <InfoBlockTitle>{_t('Object sets')}</InfoBlockTitle>

        <InfoBlockContent sx={{ mt: 0 }}>
          <Grid container columnSpacing={3}>
            {objectSets.map((set, idx) => (
              <Grid item key={idx} xs={6}>
                <ObjectSetThumbnail>
                  <Typography variant="body1">{set.title}</Typography>
                  <Typography variant="body2">{set.term}</Typography>
                </ObjectSetThumbnail>
              </Grid>
            ))}
          </Grid>
        </InfoBlockContent>
      </InfoBlock>
    )
  }

  /*******************************************************
   * RETURN
   *******************************************************/
  return (
    <OuterContentWrap sx={{ pt: 4 }}>
      <InfoBlock>
        <InfoBlockTitle>{_t('Description')}</InfoBlockTitle>
        <InfoBlockContent>{description}</InfoBlockContent>
      </InfoBlock>

      <Grid container columnSpacing={3} sx={{ mt: 3 }}>
        <Grid item xs={6}>
          <InfoBlock>
            <InfoBlockTitle>{_t('Disciplines')}</InfoBlockTitle>

            <InfoBlockContent>
              {disciplines.length
                ? disciplines?.join(', ')
                : _t('No disciplines found.')}
            </InfoBlockContent>
          </InfoBlock>
        </Grid>

        <Grid item xs={6}>
          <InfoBlock>
            <InfoBlockTitle>{_t('Created on')}</InfoBlockTitle>
            <InfoBlockContent>{String(created)}</InfoBlockContent>
          </InfoBlock>
        </Grid>
      </Grid>
      <InfoBlock sx={{ mt: 3 }}>
        <InfoBlockTitle>{_t('Permissions')}</InfoBlockTitle>
        <Users data={data} />

        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          sx={{ mt: 2 }}
        >
          <Button
            size="medium"
            variant="contained"
            color="secondary"
            startIcon={<LinkIcon />}
          >
            {_t('Generate public link')}
          </Button>
          <Button
            size="medium"
            variant="contained"
            onClick={() => dispatch(DialogMode.CONTRIBUTOR_ADD)}
          >
            {_t('Add contributor')}
          </Button>
        </Stack>
      </InfoBlock>

      <ObjectSets />
    </OuterContentWrap>
  )
}

export default OverviewTab
