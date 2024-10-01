import MenuButton, {
  MenuButtonOption
} from '@cf/components/common/menu/MenuButton'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { OuterContentWrap } from '@cf/mui/helper'
import {
  PermissionUserType,
  ProjectDetailsType,
  ProjectPermissionRole
} from '@cf/types/common'
import { CfObjectType } from '@cf/types/enum'
import { groupUsersFromRoleGroups } from '@cf/utility/marshalling/users'
import { _t, formatDate, getInitials } from '@cf/utility/utilityFunctions'
import UserRemoveFromProject from '@cfPages/Styleguide/dialog/UserRemove'
import { AppState } from '@cfRedux/types/type'
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
  useGetUsersForObjectQuery
} from '@XMLHTTP/API/workspace.rtk'
import { useState } from 'react'
import { useSelector } from 'react-redux'

import {
  InfoBlock,
  InfoBlockContent,
  InfoBlockTitle,
  ObjectSetThumbnail,
  PermissionThumbnail
} from './styles'

const roleMenuOptions: MenuButtonOption[] = [
  {
    name: ProjectPermissionRole.EDITOR,
    label: 'Editor'
  },
  {
    name: ProjectPermissionRole.COMMENTER,
    label: 'Commenter'
  },
  {
    name: ProjectPermissionRole.VIEWER,
    label: 'Viewer'
  }
]

const OverviewView = ({ disciplines, objectSets }: ProjectDetailsType) => {
  const [removeUser, setRemoveUser] = useState<PermissionUserType | null>(null)
  const { dispatch } = useDialog()
  const data = useSelector((state: AppState) => state.workflow)
  const workflow = useSelector((state: AppState) => state.workflow)

  const {
    data: usersForObjectData,
    error: usersForObjectError,
    isLoading: usersForObjectIsLoading,
    isError: usersForObjectIsError
  } = useGetUsersForObjectQuery(
    {
      id: workflow.id,
      payload: {
        objectType: CfObjectType.WORKFLOW
      }
    },
    {
      skip: !workflow.publicView
    }
  )

  // useQuery<UsersForObjectQueryResp>({
  //   queryKey: ['getUsersForObjectQuery', 5],
  //   queryFn: () => getUsersForObjectQuery(5, 'workflow'),
  //   enabled: !workflow.publicView
  // })

  // @todo this is shared with project and should be merged
  const Users = (data: UsersForObjectQueryResp) => {
    if (!data || !Object.keys(data).length) return <></>

    const usersWithRoles = groupUsersFromRoleGroups({
      viewers: data.viewers,
      commentors: data.commentors,
      editors: data.editors,
      students: data.students
    })

    if (!usersWithRoles.length) return <></>

    return (
      <InfoBlockContent>
        <List>
          {usersWithRoles.map((perm) => (
            <PermissionThumbnail key={perm.id}>
              <ListItemAvatar>
                <Avatar alt={perm.name}>{getInitials(perm.name)}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={perm.name} secondary={perm.email} />
              <MenuButton
                selected={perm.role}
                disabled={perm.role === ProjectPermissionRole.OWNER}
                options={[
                  ...roleMenuOptions,
                  {
                    name: 'mui-divider'
                  },
                  {
                    name: 'remove',
                    label: 'Remove user',
                    onClick: () => {
                      setRemoveUser(perm)
                      dispatch(DialogMode.PROJECT_REMOVE_USER)
                    }
                  }
                ]}
                onChange={(role) => console.log('changed to', role)}
                placeholder={
                  perm.role === ProjectPermissionRole.OWNER
                    ? 'Owner'
                    : roleMenuOptions.find((p) => p.name === perm.role)?.label
                }
              />
            </PermissionThumbnail>
          ))}
        </List>
      </InfoBlockContent>
    )
  }

  // @todo this is shared with project and should be merged
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
                  <Typography variant="body2">{set.type}</Typography>
                </ObjectSetThumbnail>
              </Grid>
            ))}
          </Grid>
        </InfoBlockContent>
      </InfoBlock>
    )
  }

  return (
    <OuterContentWrap sx={{ pt: 4 }}>
      <InfoBlock>
        {/*
        NOTE: legacy coponent had a collapsible drawer
        */}
        <InfoBlockContent>{data.description}</InfoBlockContent>
      </InfoBlock>
      <Grid container columnSpacing={3} sx={{ mt: 3 }}>
        <Grid item xs={6}>
          <InfoBlock>
            <InfoBlockTitle>Disciplines</InfoBlockTitle>
            <InfoBlockContent>{disciplines?.join(', ')}</InfoBlockContent>
          </InfoBlock>
        </Grid>
        <Grid item xs={6}>
          <InfoBlock>
            <InfoBlockTitle>Created on</InfoBlockTitle>
            <InfoBlockContent>{formatDate(data.createdOn)}</InfoBlockContent>
          </InfoBlock>
        </Grid>
      </Grid>

      <InfoBlock sx={{ mt: 3 }}>
        <InfoBlockTitle>Permissions</InfoBlockTitle>

        <Users {...usersForObjectData} />

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
            onClick={() => dispatch(DialogMode.ADD_CONTRIBUTOR)}
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

export default OverviewView
