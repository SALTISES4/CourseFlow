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
  ProjectDetailsType,
  PermissionUserType,
  PROJECT_PERMISSION_ROLE
} from '../../types'
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
import UserRemoveFromProject from "@cfPages/Styleguide/dialog/UserRemove";

function getInitials(name: string): string {
  const split = name.split(' ')
  return `${split[0][0]}${split[split.length - 1][0]}`
}

const roleMenuOptions: MenuButtonOption[] = [
  {
    name: PROJECT_PERMISSION_ROLE.EDITOR,
    label: 'Editor'
  },
  {
    name: PROJECT_PERMISSION_ROLE.COMMENTER,
    label: 'Commenter'
  },
  {
    name: PROJECT_PERMISSION_ROLE.VIEWER,
    label: 'Viewer'
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

  return (
    <OuterContentWrap sx={{ pt: 4 }}>
      <InfoBlock>
        <InfoBlockTitle>Description</InfoBlockTitle>
        <InfoBlockContent>{description}</InfoBlockContent>
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
            <InfoBlockContent>{created.toString()}</InfoBlockContent>
          </InfoBlock>
        </Grid>
      </Grid>

      {permissions && (
        <InfoBlock sx={{ mt: 3 }}>
          <InfoBlockTitle>Permissions</InfoBlockTitle>
          <InfoBlockContent>
            <List>
              {permissions.map((perm) => (
                <PermissionThumbnail key={perm.id}>
                  <ListItemAvatar>
                    <Avatar alt={perm.name}>{getInitials(perm.name)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={perm.name} secondary={perm.email} />
                  <MenuButton
                    selected={perm.role}
                    disabled={perm.role === PROJECT_PERMISSION_ROLE.OWNER}
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
                          dispatch(DIALOG_TYPE.PROJECT_REMOVE_USER)
                        }
                      }
                    ]}
                    onChange={(role) => console.log('changed to', role)}
                    placeholder={
                      perm.role === PROJECT_PERMISSION_ROLE.OWNER
                        ? 'Owner'
                        : roleMenuOptions.find((p) => p.name === perm.role)
                            ?.label
                    }
                  />
                </PermissionThumbnail>
              ))}
            </List>
          </InfoBlockContent>

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
              Generate public link
            </Button>
            <Button
              size="medium"
              variant="contained"
              onClick={() => dispatch(DIALOG_TYPE.ADD_CONTRIBUTOR)}
            >
              Add contributor
            </Button>
          </Stack>
        </InfoBlock>
      )}

      {objectSets && (
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
      )}

      <UserRemoveFromProject user={removeUser} />
    </OuterContentWrap>
  )
}

export default OverviewTab
