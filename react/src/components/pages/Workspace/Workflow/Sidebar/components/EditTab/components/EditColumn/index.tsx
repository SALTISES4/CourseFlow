import { selectColumnById } from '@cf/redux/selectors/column.selector'
import { columnChangeField } from '@cf/redux/slices/column.slice'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import ColorPicker from '@cfComponents/UIPrimitives/ColorPicker'
import { RootState } from '@cfRedux/store'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { debounce } from '@mui/material/utils'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../../../styles'

const EditColumn = ({ columnId }: { columnId: number }) => {
  const dispatch = useDispatch()
  const column = useSelector((state: RootState) =>
    selectColumnById(state, columnId)
  )

  const columnColourHex = ThemeHelper.getColumnColour({
    columnType: column.columnType,
    colour: column.colour
  })

  const [color, setColor] = useState(columnColourHex)

  const onTitleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      dispatch(
        columnChangeField({
          id: columnId,
          data: {
            title: e.target.value
          }
        })
      )
    },
    [dispatch, columnId]
  )

  const onColorChange = useCallback((color: string) => {
    setColor(color)
  }, [])

  const debouncedUpdate = useMemo(
    () =>
      debounce((color: string) => {
        dispatch(
          columnChangeField({
            id: columnId,
            data: { colour: color }
          })
        )
      }, 50),
    [dispatch, columnId]
  )

  useEffect(() => {
    debouncedUpdate(color)
  }, [color, debouncedUpdate])

  return (
    <SidebarInnerWrap>
      <SidebarContent>
        <SidebarTitle as="h3" variant="h6">
          {_t('Edit node category')}
        </SidebarTitle>
        <Stack direction="column" gap={3}>
          <TextField
            variant="outlined"
            label={_t('Title')}
            size="small"
            value={column.title ?? column.columnTypeDisplay}
            onChange={onTitleChange}
          />
          <ColorPicker size="small" color={color} onChange={onColorChange} />
        </Stack>
      </SidebarContent>
      <SidebarActions>
        <Button variant="contained" color="secondary">
          {_t('Duplicate')}
        </Button>
        <Button variant="contained" color="secondary">
          {_t('Delete')}
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default EditColumn
