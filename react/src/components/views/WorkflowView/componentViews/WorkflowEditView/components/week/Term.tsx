import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import { selectWeekById } from '@cfRedux/selectors/week.selector'
import { RootState } from '@cfRedux/store'
import NodeWrapper from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeWrapper'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import clsx from 'clsx'
import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

type OwnProps = {
  objectId: number
  parentId: number
  rank: number
  columnOrder: any[]
  nodesByColumn: Record<string, number[]>
}

const Term = ({
  objectId,
  parentId,
  rank,
  columnOrder,
  nodesByColumn
}: OwnProps) => {
  const term = useSelector((state: RootState) =>
    selectWeekById(state, objectId)
  )

  const mainDiv = useRef<HTMLDivElement>(null)
  const nodeBlock = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const classIdentifiers = {
      objectClass: '.node-week',
      handle: '.node',
      container: '.week-block'
    }
  }, [term, columnOrder])

  const nodeBlocks = columnOrder.map((col) => {
    const nodeweeks = nodesByColumn[col]?.map((nodeweek) => (
      <NodeWrapper
        key={nodeweek}
        objectId={nodeweek}
        parentId={term.id}
        row={1} // @todo what is this
        //        columnOrder={columnOrder}
      />
    ))

    if (!nodeweeks || nodeweeks.length === 0) {
      nodeweeks?.push(
        <div className="node-week placeholder" style={{ height: '100%' }}></div>
      )
    }

    return (
      <div
        className={`node-block term column-${col}`}
        id={`${objectId}-node-block-column-${col}`}
        key={col}
      >
        {nodeweeks}
      </div>
    )
  })

  return (
    <div
      style={ThemeHelper.getBorderStyle({
        isLocked: term.lock.lock,
        colour: term.lock.userColour
      })}
      className={clsx('week', {
        strategy: term.isStrategy,
        dropped: term.isDropped,
        [`locked`]: term.lock,
        [`locked-${term.lock.userId}`]: term.lock
      })}
      ref={mainDiv}
      onClick={(e) => {
        e.stopPropagation()
        // selection manager goes here
      }}
    >
      <TitleText
        text={term.title}
        defaultText={`${term.weekTypeDisplay} ${rank + 1}`}
      />
      <div id={`${objectId}-node-block`} className="node-block" ref={nodeBlock}>
        {nodeBlocks}
      </div>
      <div
        className="week-drop-row hover-shade"
        onClick={(evt) => {
          evt.stopPropagation()
          //  toggleDropReduxAction goes here
        }}
      >
        <div className="node-drop-side node-drop-left"></div>
        <div className="node-drop-middle">
          <ArrowDropDownIcon />
        </div>
        <div className="node-drop-side node-drop-right"></div>
      </div>
    </div>
  )
}

export default Term
