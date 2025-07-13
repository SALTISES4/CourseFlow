import {
  draggable,
  dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import theme from '@cf/mui/theme'
import BetterSelectionManager from '@cf/redux/BetterSelectionManager'
import { Outcome as OutcomeType } from '@cf/redux/slices/outcomes.slice'
import { addOutcome, moveOutcome } from '@cf/redux/slices/outcomes.slice'
import { AppState } from '@cf/redux/types/type'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { SxProps } from '@mui/material'
import Box from '@mui/material/Box'
import { produce } from 'immer'
import {
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from './styles'

const AddButton = ({ sx, onClick }: { onClick: () => void; sx?: SxProps }) => (
  <Styled.AddNewButton sx={sx} variant="text" disableRipple onClick={onClick}>
    {_t('Add outcome')}
  </Styled.AddNewButton>
)

const OutcomeGroupWrap = ({
  id,
  title,
  children,
  level = 0
}: OutcomeType & {
  level?: number
}) => {
  const dispatch = useDispatch()

  const onAddNewOutcome = useCallback(() => {
    dispatch(
      addOutcome({
        id,
        title: 'Blank Outcome title'
      })
    )
  }, [dispatch, id])

  return (
    <GroupDropzone id={id} level={level + 1}>
      <Styled.OutcomeGroupWrap>
        <Styled.OutcomeGroupTitle variant="body2">
          {title}
        </Styled.OutcomeGroupTitle>
        <OutcomeGroup level={level + 1} outcomes={children} />
        <AddButton onClick={onAddNewOutcome} />
      </Styled.OutcomeGroupWrap>
    </GroupDropzone>
  )
}

const OutcomeGroup = ({
  outcomes,
  level
}: {
  outcomes: OutcomeType[]
  level: number
}) => {
  if (!outcomes.length) {
    return null
  }

  return (
    <Styled.OutcomeGroup>
      {outcomes.map((outcome) => (
        <li key={outcome.id}>
          <Outcome level={level} {...outcome} />
        </li>
      ))}
    </Styled.OutcomeGroup>
  )
}

type OutcomeStateType = {
  collapsed: boolean
  dragging: boolean
}

const Outcome = ({
  id,
  title,
  children,
  level
}: OutcomeType & { level: number }) => {
  const dragHandle = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()
  const sidebarData = useSelector((state: AppState) => state.sidebar.edit)
  const manager = useRef(new BetterSelectionManager(dispatch))
  const [state, setState] = useState<OutcomeStateType>({
    collapsed: true,
    dragging: false
  })

  useEffect(() => {
    const el = dragHandle.current

    if (!el) {
      return
    }

    return draggable({
      element: el,
      getInitialData: () => ({
        id,
        level
      }),
      onDragStart: () => {
        setState(
          produce((draft) => {
            draft.dragging = !draft.dragging
          })
        )
      },
      onDrop: () => {
        setState(
          produce((draft) => {
            draft.dragging = false
          })
        )
      }
    })
  }, [dragHandle, id, level])

  const selected =
    sidebarData.objectType === CfObjectType.OUTCOME && sidebarData.id === id

  const onAddNewClick = useCallback(() => {
    dispatch(
      addOutcome({
        id,
        title: 'Blank Outcome title'
      })
    )
  }, [dispatch, id])

  const onToggleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setState(
      produce((draft) => {
        draft.collapsed = !draft.collapsed
      })
    )
  }, [])

  const onHeaderClick = useCallback(() => {
    if (selected) {
      manager.current.clearSidebar()
    } else {
      manager.current.updateSidebar(id, CfObjectType.OUTCOME, -1)
    }
  }, [id, selected])

  const showToggleButton = level !== 3

  return (
    <Box data-level={level}>
      <Styled.OutcomeHeader
        ref={dragHandle}
        selected={selected}
        onClick={onHeaderClick}
      >
        <Styled.OutcomeTitle variant="body2">{title}</Styled.OutcomeTitle>
        {showToggleButton && (
          <Styled.OutcomeHeaderToggle onClick={onToggleClick}>
            {state.collapsed ? (
              <AddIcon fontSize="small" />
            ) : (
              <RemoveIcon fontSize="small" />
            )}
          </Styled.OutcomeHeaderToggle>
        )}
      </Styled.OutcomeHeader>

      {!state.collapsed && (
        <GroupDropzone id={id} level={level + 1}>
          {children && <OutcomeGroup level={level + 1} outcomes={children} />}
          {showToggleButton && (
            <footer style={{ paddingLeft: theme.spacing(level) }}>
              <AddButton onClick={onAddNewClick} />
            </footer>
          )}
        </GroupDropzone>
      )}
    </Box>
  )
}

const GroupDropzone = ({
  id,
  children,
  level
}: {
  id: number
  children: ReactNode
  level: number
}) => {
  const dispatch = useDispatch()
  const dropRef = useRef<HTMLDivElement>(null)
  const [draggingOver, setDraggingOver] = useState(false)

  useEffect(() => {
    const el = dropRef.current

    return dropTargetForElements({
      element: el,
      onDragEnter: () => {
        setDraggingOver(true)
      },
      onDragLeave: () => {
        setDraggingOver(false)
      },
      canDrop: ({ source }) => {
        // only allow reordering of same level items
        const data = source.data
        return data.level === level
      },
      onDrop: ({ source }) => {
        const data = source.data
        dispatch(
          moveOutcome({
            targetId: data.id as number,
            moveToId: id
          })
        )
        setDraggingOver(false)
      }
    })
  }, [dispatch, level, id])

  return (
    <div
      ref={dropRef}
      data-allow={level}
      style={{ backgroundColor: draggingOver ? '#efffe6' : '' }}
    >
      {children}
    </div>
  )
}

export default OutcomeGroupWrap
