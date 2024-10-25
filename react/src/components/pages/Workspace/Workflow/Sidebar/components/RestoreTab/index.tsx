import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { produce } from 'immer'
import { Fragment, useCallback, useState } from 'react'

import { StyledRestorableBlock } from './styles'
import {
  GroupWrap,
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../styles'
import { RestorableBlock, SidebarDataType } from '../../types'

type RestorableBlockType = {
  group: number
  index: number
}

function getRestoreItems(
  data: SidebarDataType['restore']['groups'],
  items: RestorableBlockType[]
) {
  const found: RestorableBlock[] = []

  if (data) {
    items.forEach((item) => {
      found.push(data[item.group].blocks[item.index])
    })
  }

  return found
}

const RestoreTab = ({ title, groups }: SidebarDataType['restore']) => {
  const [restoreGroups, setRestoreGroups] = useState(groups ?? [])
  const [selected, setSelected] = useState<RestorableBlockType[]>([])

  const removeFromState = useCallback(() => {
    setRestoreGroups(
      produce((draft) => {
        selected.forEach((i) => {
          draft[i.group].blocks.splice(i.index, 1)
        })
        setSelected([])
      })
    )
  }, [selected])

  const onRestoreClick = useCallback(() => {
    console.log('restoring', getRestoreItems(restoreGroups, selected))
    removeFromState()
  }, [removeFromState, restoreGroups, selected])

  const onDeleteClick = useCallback(() => {
    console.log(
      'permanently deleting',
      getRestoreItems(restoreGroups, selected)
    )
    removeFromState()
  }, [removeFromState, restoreGroups, selected])

  const onSelectItem = useCallback((group: number, index: number) => {
    setSelected(
      produce((draft) => {
        const foundIndex = draft.findIndex(
          (item) => item.group === group && item.index === index
        )
        if (foundIndex !== -1) {
          draft.splice(foundIndex, 1)
        } else {
          draft.push({ group: group, index })
        }
      })
    )
  }, [])

  return (
    <SidebarInnerWrap>
      <SidebarContent>
        <SidebarTitle as="h3" variant="h6">
          {title}
        </SidebarTitle>
        {restoreGroups.map((group, groupId) => (
          <Fragment key={groupId}>
            {!!group.blocks.length && (
              <GroupWrap>
                <Typography component="h6" variant="body2">
                  {group.title}
                </Typography>
                <ul>
                  {group.blocks.map((block, blockId) => {
                    const highlight =
                      selected.findIndex(
                        (item) =>
                          item.group === groupId && item.index === blockId
                      ) !== -1
                    return (
                      <StyledRestorableBlock
                        key={`${groupId}_${blockId}`}
                        component="li"
                        selected={highlight}
                        onClick={() => onSelectItem(groupId, blockId)}
                      >
                        {block.label}
                      </StyledRestorableBlock>
                    )
                  })}
                </ul>
              </GroupWrap>
            )}
          </Fragment>
        ))}
      </SidebarContent>
      {!!selected.length && (
        <SidebarActions>
          <Button variant="contained" color="primary" onClick={onRestoreClick}>
            Restore
          </Button>
          <Button variant="contained" color="secondary" onClick={onDeleteClick}>
            Delete permanently
          </Button>
        </SidebarActions>
      )}
    </SidebarInnerWrap>
  )
}

export default RestoreTab
