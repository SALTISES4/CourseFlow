import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import { calcWorkflowPermissions } from '@cf/utility/permissions'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { selectColumnById } from '@cfRedux/selectors/column.selector'
import { RootState } from '@cfRedux/store'
import { TNode } from '@cfRedux/types/type'
import NodeTitle from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeTitle'
import clsx from 'clsx'
import React, { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

type OwnProps = {
  node: TNode
  parentId: number
}

const GridNode: React.FC<OwnProps> = ({ node, parentId }) => {
  const dispatch = useDispatch()

  const column = useSelector((state: RootState) =>
    selectColumnById(state, node.column)
  )
  const workflow = useSelector((state: RootState) => state.workspace.workflow)

  const mainDiv = useRef<HTMLDivElement>(null)
  const manager = useRef(new BetterSelectionManager(dispatch))
  const objectType = CfObjectType.NODE

  const style: React.CSSProperties = {
    backgroundColor: ThemeHelper.getColumnColour({
      columnType: column?.columnType,
      colour: column?.colour
    }),
    outline: node.lock ? `2px solid ${node.lock.userColour}` : undefined
  }

  const permissions = calcWorkflowPermissions(workflow.userPermissions)
  const comments = permissions.read ? <>commentbox placeholder</> : null

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    manager.current.updateSidebar(node.id, objectType, node.id)
  }

  const Ponderation = () => {
    const dataOverride = node.representsWorkflow
      ? { ...node, ...node.linkedWorkflowData, id: node.id }
      : node

    return (
      <div className="grid-ponderation">
        {`${dataOverride.ponderationTheory}/${dataOverride.ponderationPractical}/${dataOverride.ponderationIndividual}`}
      </div>
    )
  }

  return (
    <div
      id={String(node.id)}
      className={clsx(
        `node column-${node.column}`,
        Constants.nodeKeys[node.nodeType],
        node.isDropped && 'dropped',
        node.lock && `locked locked-${node.lock.userId}`
      )}
      style={style}
      ref={mainDiv}
      onClick={handleClick}
    >
      <div className="node-top-row">
        <NodeTitle node={node} />
        <Ponderation />
      </div>
      <div className="mouseover-actions">{comments}</div>
      <div className="side-actions">
        <div className="comment-indicator-container"></div>
      </div>
    </div>
  )
}

export default GridNode
