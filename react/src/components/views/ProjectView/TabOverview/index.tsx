import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { OuterContentWrap } from '@cf/mui/helper'
import {
  PermissionGroup,
  PermissionUserType,
  ProjectDetailsType
} from '@cf/types/common'
import { CfObjectType } from '@cf/types/enum'
import { groupUsersFromPermissionGroups } from '@cf/utility/marshalling/users'
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
  useGetUsersForObjectQuery
} from '@XMLHTTP/API/workspaceUser.rtk'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import ContributorAddDialog from 'components/common/dialog/Workspace/ContributorAddDialog'

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
  objectSets
}: ProjectDetailsType) => {
  const [removeUser, setRemoveUser] = useState<PermissionUserType | null>(null)
  const { dispatch } = useDialog()
  const { id } = useParams()
  const projectId = Number(id)

  const { data, error, isLoading, isError } = useGetUsersForObjectQuery({
    id: projectId,
    payload: {
      objectType: CfObjectType.PROJECT
    }
  })

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const Users = ({ data }: { data: UsersForObjectQueryResp }) => {
    console.log('data')
    console.log(data)
    if (!data) return <></>

    const usersWithRoles = groupUsersFromPermissionGroups({
      viewers: data.viewers,
      commentors: data.commentors,
      editors: data.editors,
      students: data.students
    })

    console.log('usersWithRoles')
    console.log(usersWithRoles)

    return (
      <InfoBlockContent>
        <List>
          <PermissionThumbnail>
            <ListItemAvatar>
              <Avatar alt={data.author.firstName}>
                {getInitials(data.author.firstName)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={data.author.firstName}
              secondary={data.author.email}
            />
            <Button disabled>owner</Button>
          </PermissionThumbnail>

          {usersWithRoles.map((user) => (
            <PermissionThumbnail key={user.id}>
              <ListItemAvatar>
                <Avatar alt={user.name}>{getInitials(user.name)}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={user.name} secondary={user.email} />
              <MenuButton
                disabled={false} // this needs to be a check on call to see if current user can edit
                options={[
                  ...permissionGroupMenuOptions.map((item) => ({
                    name: String(item.value),
                    label: item.label
                  })),
                  {
                    name: 'mui-divider'
                  },
                  {
                    name: 'remove',
                    label: 'Remove user',
                    onClick: () => {
                      setRemoveUser(user)
                      dispatch(DialogMode.CONTRIBUTOR_REMOVE, { userId: 10 })
                    }
                  }
                ]}
                onChange={(role) => console.log('changed to', role)}
                placeholder={
                  permissionGroupMenuOptions.find(
                    (p) => p.value === user.permissionGroup
                  )?.label
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
      <ContributorAddDialog />
    </OuterContentWrap>
  )
}

export default OverviewTab
