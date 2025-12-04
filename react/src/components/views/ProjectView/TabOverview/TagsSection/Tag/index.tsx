import { _t } from '@cf/utility/Utility.class'
import CloseIcon from '@mui/icons-material/Close'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import { produce } from 'immer'
import {
  ChangeEventHandler,
  FocusEventHandler,
  MouseEvent,
  useCallback,
  useRef,
  useState
} from 'react'

import * as Styled from './styles'

type PropsType = {
  id: number
  label?: string
  create?: boolean
  disabled?: boolean
  onChange: (id: number, value: string, createNew: boolean) => void
  onDelete?: (id: number) => void
}

type StateType = {
  label: string
  focused: boolean
}

const Tag = ({
  create,
  label,
  id,
  disabled,
  onChange,
  onDelete
}: PropsType) => {
  const [state, setState] = useState<StateType>({
    label: label ?? '',
    focused: false
  })

  const inputRef = useRef<HTMLInputElement>(null)

  const onWrapClick = useCallback(() => {
    setState(
      produce((draft) => {
        draft.focused = true
        inputRef?.current.focus()
      })
    )
  }, [])

  const onInputChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      setState(
        produce((draft) => {
          draft.label = e.target.value
        })
      )
    },
    []
  )

  const onInputFocus: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
    setState(
      produce((draft) => {
        draft.focused = true
      })
    )
  }, [])

  const onClickAway = useCallback(() => {
    if (!state.focused) {
      return
    }

    onChange(id, state.label, create)

    setState(
      produce((draft) => {
        draft.label = create ? '' : draft.label
        draft.focused = false
      })
    )
  }, [onChange, id, create, state.focused, state.label])

  const onDeleteClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      onDelete(id)
    },
    [onDelete, id]
  )

  return (
    <ClickAwayListener onClickAway={onClickAway}>
      <Styled.Tag
        focused={state.focused}
        disabled={disabled}
        create={create}
        onClick={onWrapClick}
      >
        <Styled.TagIcon>
          <LocalOfferOutlinedIcon />
        </Styled.TagIcon>
        <Styled.TagInput
          ref={inputRef}
          value={state.label}
          disabled={disabled}
          onFocus={onInputFocus}
          onChange={onInputChange}
          placeholder={create ? _t('Add new tag') : null}
        />
        {!create && (
          <Styled.DeleteButton tabIndex={-1} onClick={onDeleteClick}>
            <CloseIcon />
          </Styled.DeleteButton>
        )}
      </Styled.Tag>
    </ClickAwayListener>
  )
}

export default Tag
