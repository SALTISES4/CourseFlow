import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import { _t } from '@cf/utility/Utility.class'
import Utility from '@cf/utility/Utility.class'
import { OutcomeTitle } from '@cfComponents/UIPrimitives/Titles.ts.tsx'
import SortableDragAndDropManager from '@cfEditableComponents/SortableDragAndDropManager.class'
import ActionCreator from '@cfRedux/ActionCreator'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { selectOutcomeById } from '@cfRedux/selectors/outcome.selector'
import { RootState } from '@cfRedux/store'
import { TWorkflow } from '@cfRedux/types/type'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { updateOutcomehorizontallinkDegree } from '@XMLHTTP/API/update'
import { insertedAtInstant } from '@XMLHTTP/API/update'
import { insertedAt } from '@XMLHTTP/postTemp.js'
import clsx from 'clsx'
import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import OutcomeHorizontalLink from './OutcomeHorizontalLink'
import OutcomeWrapper from './OutcomeWrapper'

class OutcomeDragAndDropManager extends SortableDragAndDropManager {
  onMovedIn(id, newPosition, type, newParent, childId) {
    this.context.editableMethods.microUpdate(
      ActionCreator.moveOutcomeOutcome(id, newPosition, newParent, childId)
    )
    insertedAt(
      this.context.selectionManager,
      childId,
      CfObjectType.OUTCOME,
      newParent,
      CfObjectType.OUTCOME,
      newPosition,
      CfObjectType.OUTCOMEOUTCOME
    )
  }

  onMovedOut(id, newPosition, type, newParent, childId) {
    if (
      confirm(
        _t(
          "You've moved an outcome to another workflow. Nodes tagged with this outcome will have it removed. Do you want to continue?"
        )
      )
    ) {
      insertedAt(
        this.context,
        null,
        CfObjectType.OUTCOME,
        newParent,
        CfObjectType.OUTCOME,
        newPosition,
        CfObjectType.OUTCOMEOUTCOME
      )
      insertedAtInstant(
        childId,
        CfObjectType.OUTCOME,
        newParent,
        CfObjectType.OUTCOME,
        newPosition,
        CfObjectType.OUTCOMEOUTCOME
      )
    }
  }

  makeDroppable(sortableBlock: JQuery<HTMLElement>) {
    if (!sortableBlock) {
      Utility.logger('no sortable block found ')
      return
    }

    sortableBlock.droppable({
      tolerance: 'pointer',
      droppable: '.outcome-ghost',
      over: (e, ui) => {
        const dropItem = $(e.target)
        const dragItem = ui.draggable
        const dragHelper = ui.helper
        const newIndex = dropItem.prevAll().length
        const newParentId = parseInt(dropItem.parent().attr('id'))

        if (dragItem.hasClass('outcome')) {
          dragHelper.addClass('valid-drop')
          dropItem.addClass('outcome-drop-over')
          return
        } else {
          return
        }
      },
      out: (e, ui) => {
        const dragItem = ui.draggable
        const dragHelper = ui.helper
        const dropItem = $(e.target)
        if (dragItem.hasClass('outcome')) {
          dragHelper.removeClass('valid-drop')
          dropItem.removeClass('outcome-drop-over')
        }
      },
      drop: (e, ui) => {
        $('.outcome-drop-over').removeClass('outcome-drop-over')
        const dropItem = $(e.target)
        const dragItem = ui.draggable
        if (dragItem.hasClass('outcome')) {
          updateOutcomehorizontallinkDegree(
            this.args.objectId,
            // @todo HACK, this is being used to bypass react and pass information around the DOM
            dragItem[0].dataDraggable.outcome,
            1,
            (responseData) => {}
          )
        }
      }
    })
  }
}

// type ConnectedProps = {
//   outcome: TGetOutcomeByID
//   workflow: TWorkflow
// }
//
// type StateProps = {
//   showHorizontalLinks: boolean
// }

type PropsType = {
  objectId: number
  parentId: number
  throughParentId?: number
  showHorizontal?: boolean
}

const Outcome: React.FC<PropsType> = ({
  objectId,
  parentId,
  showHorizontal
}) => {
  /*******************************************************
   * HOOKS: REDUX
   *******************************************************/
  const dispatch = useDispatch()
  const outcomeData = useSelector((state: RootState) =>
    selectOutcomeById(state, objectId)
  )
  const workflow = useSelector((state: RootState) => state.workspace.workflow)

  /*******************************************************
   * HOOKS: REFS
   *******************************************************/
  const childrenBlock = useRef<HTMLOListElement>(null)
  const mainDiv = useRef<HTMLDivElement>(null)
  const manager = useRef(new BetterSelectionManager(dispatch))
  const outcomeDragAndDropManager = useRef(
    new OutcomeDragAndDropManager({ objectId, parentId })
  )

  /*******************************************************
   * HOOKS: STATE
   *******************************************************/
  const [showHorizontalLinks, setShowHorizontalLinks] = useState(false)

  const data = outcomeData.outcome

  useEffect(() => {
    if (!showHorizontal) {
      return
    }

    const classIdentifiers = {
      objectClass: '.node-week',
      handle: '.outcome',
      container: '.week-block'
    }

    outcomeDragAndDropManager.current.makeSortableElement(
      $(childrenBlock.current).children('.outcome-outcome').not('ui-draggable'),
      objectId,
      CfObjectType.OUTCOMEOUTCOME,
      `.outcome-outcome-${data.depth}`,
      null,
      false,
      `#workflow-${workflow.id}`,
      classIdentifiers.handle
    )

    if (data.depth === 0) {
      outcomeDragAndDropManager.current.makeDroppable($(mainDiv.current))
    }
  }, [showHorizontal])

  if (Utility.checkSetHidden(data, outcomeData.objectSets)) {
    return null
  }

  const Children = () => {
    if (!data.isDropped) {
      return <></>
    }
    // this is a tree implementation
    // i don't think it's worth trying to sort through this
    return data.childOutcomeLinks.map((outcomeoutcome) => (
      <OutcomeWrapper
        key={outcomeoutcome}
        objectId={outcomeoutcome}
        parentId={data.id}
        showHorizontal={showHorizontal}
        parentDepth={data.depth}
      />
    ))
  }

  const OutcomeHorizontalLinks = () => {
    if (!showHorizontalLinks) {
      return <></>
    }

    return (
      <div
        className="outcome-node-container"
        onMouseLeave={() => setShowHorizontalLinks(false)}
      >
        {data.outcomeHorizontalLinksUnique.map((horizontalLink) => (
          <OutcomeHorizontalLink
            key={horizontalLink}
            objectId={horizontalLink}
          />
        ))}
      </div>
    )
  }

  const SideActions = () => {
    if (showHorizontal && data.outcomeHorizontalLinksUnique.length <= 0) {
      return <></>
    }
    return (
      <div className="outcome-node-indicator">
        <div
          className="outcome-node-indicator-number"
          onMouseEnter={() => setShowHorizontalLinks(true)}
        >
          {data.outcomeHorizontalLinksUnique.length}
        </div>
        <OutcomeHorizontalLinks />
      </div>
    )
  }

  const dropText = data.isDropped
    ? _t('hide')
    : _t('show ') +
      data.childOutcomeLinks.length +
      ' ' +
      window.ngettext(
        'descendant',
        'descendants',
        data.childOutcomeLinks.length
      )

  const style: React.CSSProperties = data.lock
    ? { border: `2px solid ${data.lock.userColour}` }
    : {}

  return (
    <div
      style={style}
      className={clsx(`outcome outcome-${data.id}`, {
        dropped: data.isDropped,
        [`locked locked-${data.lock?.userId}`]: data.lock
      })}
      ref={mainDiv}
      onClick={(e) => {
        e.stopPropagation()
        manager.current.updateSidebar(data.id, CfObjectType.OUTCOME, parentId)
      }}
    >
      <div className="outcome-title">
        <OutcomeTitle
          title={data.title}
          prefix={outcomeData.prefix}
          hovertext={outcomeData.hovertext}
        />
      </div>

      {data.depth < 2 && data.childOutcomeLinks.length > 0 && (
        <div
          className="outcome-drop"
          onClick={(evt) => {
            evt.stopPropagation()
            manager.current.toggleDropReduxAction({
              objectId,
              objectType: Constants.objectDictionary[CfObjectType.OUTCOME],
              newDropState: !data.isDropped
            })
          }}
        >
          <div className="outcome-drop-img">
            <ArrowDropDownIcon />
          </div>
          <div className="outcome-drop-text">{dropText}</div>
        </div>
      )}

      {data.depth < 2 && (
        <ol
          className={`children-block children-block-${data.depth}`}
          id={`${objectId}-children-block`}
          ref={childrenBlock}
        >
          {/*
        @todo hard to fix this with no children in data

        */}
          <Children />
        </ol>
      )}

      {workflow.workflowPermissions.write && data.depth < 2 && (
        <div
          className="outcome-create-child"
          onClick={() => {
            //                 // @todo update this with mutation
            //                 // insertChild({
            //                 //   id: this.props.objectId,
            //                 //   objectType: this.objectType
            //                 // })
          }}
        >
          {_t('+ Add New')}
        </div>
      )}

      {/*<HoverMenu*/}
      {/*  canWrite={workflow.workflowPermissions.write}*/}
      {/*  canComment={workflow.workflowPermissions.addComments}*/}
      {/*  objectId={objectId}*/}
      {/*  parentId={parentId}*/}
      {/*  objectType={CfObjectType.OUTCOME}*/}
      {/*/>*/}

      <div className="side-actions">
        <SideActions />
        <div className="comment-indicator-container" />
      </div>
    </div>
  )
}

export default Outcome
