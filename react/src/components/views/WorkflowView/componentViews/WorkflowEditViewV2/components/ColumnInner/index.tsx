import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { selectColumnById } from '@cfRedux/selectors/column.selector'
import { RootState } from '@cfRedux/store'
import clsx from 'clsx'
import * as React from 'react'
import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from './styles'

type OwnProps = {
  objectId: number
  parentId: number
}

type PropsType = OwnProps

/**
 * The column in a workflow.
 */
const Column = ({ objectId, parentId }: PropsType) => {
  /*******************************************************
   * CONST
   *******************************************************/
  const mainDiv = React.useRef<HTMLDivElement>(null)

  const objectType = CfObjectType.COLUMN

  /*******************************************************
   * HOOKS: REDUX
   *******************************************************/
  const dispatch = useDispatch()
  const column = useSelector((state: RootState) =>
    selectColumnById(state, objectId)
  )
  const workflow = useSelector((state: RootState) => state.workspace.workflow)

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  const manager = useMemo(
    () => new BetterSelectionManager(dispatch),
    [dispatch]
  )

  /**
   * @onClickHandler
   *
   **/
  const onClickHandler = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (column) {
      manager.updateSidebar(column.id, objectType, parentId)
    }
  }

  const columnColourHex = useMemo(() => {
    return ThemeHelper.getColumnColour({
      columnType: column.columnType,
      colour: column.colour
    })
  }, [column.colour, column.columnType])

  /*******************************************************
   * RENDER
   *******************************************************/

  if (!column || !workflow) {
    return null
  }

  const title = column.title ?? column.columnTypeDisplay

  return (
    <Styled.Column
      ref={mainDiv}
      border={column.lock && `2px solid ${column.lock.userColour}`}
      className={clsx(
        column.lock && 'locked',
        column.lock && `locked-${column.lock.userId}`
      )}
      onClick={onClickHandler}
    >
      <Styled.Border color={columnColourHex} />
      <Styled.Title variant="body2">
        <span dangerouslySetInnerHTML={{ __html: title }}></span>
      </Styled.Title>
    </Styled.Column>
  )
}

export default Column
