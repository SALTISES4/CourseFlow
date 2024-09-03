import { useState } from 'react'
import { OuterContentWrap } from '@cf/mui/helper'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import List from '@mui/material/List'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import LinkIcon from '@mui/icons-material/Link'

import {
  InfoBlock,
  InfoBlockTitle,
  InfoBlockContent,
  PermissionThumbnail,
  ObjectSetThumbnail
} from './styles'
import MenuButton, {
  MenuButtonOption
} from '@cfPages/Styleguide/components/MenuButton'
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import UserRemoveFromProject from '@cfPages/Styleguide/dialog/UserRemove'
import { _t, getInitials } from '@cf/utility/utilityFunctions'
import { useQuery } from '@tanstack/react-query'
import { UsersForObjectQueryResp } from '@XMLHTTP/types/query'
import { getUsersForObjectQuery } from '@XMLHTTP/API/sharing'
import { groupUsersFromRoleGroups } from '@cf/utility/marshalling/users'
import {
  PermissionUserType,
  PROJECT_PERMISSION_ROLE,
  ProjectDetailsType
} from '@cfPages/Styleguide/views/Project/types'

const roleMenuOptions: MenuButtonOption[] = [
  {
    name: PROJECT_PERMISSION_ROLE.EDITOR,
    label: _t('Editor')
  },
  {
    name: PROJECT_PERMISSION_ROLE.COMMENTER,
    label: _t('Commenter')
  },
  {
    name: PROJECT_PERMISSION_ROLE.VIEWER,
    label: _t('Viewer')
  }
]

const OverviewTab = ({
  description,
  disciplines,
  created,
  permissions,
  objectSets
}: ProjectDetailsType) => {
  const [removeUser, setRemoveUser] = useState<PermissionUserType | null>(null)
  const { dispatch } = useDialog()

  const { data, error, isLoading, isError } = useQuery<UsersForObjectQueryResp>(
    {
      queryKey: ['getUsersForObjectQuery', 5],
      queryFn: () => getUsersForObjectQuery(5, 'project')
    }
  )

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const Users = (data: UsersForObjectQueryResp) => {
    if (!permissions) return <></>

    const usersWithRoles = groupUsersFromRoleGroups({
      viewers: data.viewers,
      commentors: data.commentors,
      editors: data.editors,
      students: data.students
    })

    return (
      <InfoBlockContent>
        <List>
          {usersWithRoles.map((user) => (
            <PermissionThumbnail key={user.id}>
              <ListItemAvatar>
                <Avatar alt={user.name}>{getInitials(user.name)}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={user.name} secondary={user.email} />
              <MenuButton
                selected={user.role}
                disabled={user.role === PROJECT_PERMISSION_ROLE.OWNER}
                options={[
                  ...roleMenuOptions,
                  {
                    name: 'mui-divider'
                  },
                  {
                    name: 'remove',
                    label: 'Remove user',
                    onClick: () => {
                      setRemoveUser(user)
                      dispatch(DIALOG_TYPE.PROJECT_REMOVE_USER)
                    }
                  }
                ]}
                onChange={(role) => console.log('changed to', role)}
                placeholder={
                  user.role === PROJECT_PERMISSION_ROLE.OWNER
                    ? 'Owner'
                    : roleMenuOptions.find((p) => p.name === user.role)?.label
                }
              />
            </PermissionThumbnail>
          ))}
        </List>
      </InfoBlockContent>
    )
  }

  const ObjectSets = () => {
    if (!objectSets) return <></>
    return (
      <InfoBlock sx={{ mt: 3 }}>
        <InfoBlockTitle>Object sets</InfoBlockTitle>
        <InfoBlockContent sx={{ mt: 0 }}>
          <Grid container columnSpacing={3}>
            {objectSets.map((set, idx) => (
              <Grid item key={idx} xs={6}>
                <ObjectSetThumbnail>
                  <Typography variant="body1">{set.title}</Typography>
                  <Typography variant="body2">{set.type}</Typography>
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
        <Users {...data} />

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
            onClick={() => dispatch(DIALOG_TYPE.ADD_CONTRIBUTOR)}
          >
            {_t('Add contributor')}
          </Button>
        </Stack>
      </InfoBlock>

      <ObjectSets />

      <UserRemoveFromProject user={removeUser} />
    </OuterContentWrap>
  )
}

export default OverviewTab
