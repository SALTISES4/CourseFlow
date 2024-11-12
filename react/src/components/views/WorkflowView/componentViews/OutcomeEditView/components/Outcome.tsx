import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import { _t } from '@cf/utility/Utility.class'
import Utility from '@cf/utility/Utility.class'
import { OutcomeTitle } from '@cfComponents/UIPrimitives/Titles.ts'
import { HoverMenu } from '@cfEditableComponents/hoverEditActions'
import SortableDragAndDropManager from '@cfEditableComponents/SortableDragAndDropManager.class'
import ActionCreator from '@cfRedux/ActionCreator'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { selectOutcomeById } from '@cfRedux/selectors/outcome.selector'
import { AppState, TWorkflow } from '@cfRedux/types/type'
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
          COURSEFLOW_APP.tinyLoader.startLoad()
          updateOutcomehorizontallinkDegree(
            this.args.objectId,
            // @todo HACK, this is being used to bypass react and pass information around the DOM
            dragItem[0].dataDraggable.outcome,
            1,
            (responseData) => {
              COURSEFLOW_APP.tinyLoader.endLoad()
            }
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
  const outcomeData = useSelector((state: AppState) =>
    selectOutcomeById(state, objectId)
  )
  const workflow = useSelector((state: AppState) => state.workflow)

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

      <HoverMenu
        canWrite={workflow.workflowPermissions.write}
        canComment={workflow.workflowPermissions.addComments}
        objectId={objectId}
        parentId={parentId}
        objectType={CfObjectType.OUTCOME}
      />

      <div className="side-actions">
        <SideActions />
        <div className="comment-indicator-container" />
      </div>
    </div>
  )
}

export default Outcome

/**
 * Basic component representing an outcome
 */
// class OutcomeUnconnected extends React.Component<PropsType, StateProps> {
//   private childrenBlock: React.RefObject<HTMLOListElement>
//   private manager: BetterSelectionManager
//   private objectType: CfObjectType
//   private mainDiv: React.RefObject<HTMLDivElement>
//   private outcomeDragAndDropManager
//
//   constructor(props: PropsType) {
//     super(props)
//     this.manager = new BetterSelectionManager(this.props.dispatch)
//     this.objectType = CfObjectType.OUTCOME
//     this.outcomeDragAndDropManager = new OutcomeDragAndDropManager({
//       objectId: this.props.objectId,
//       parentId: this.props.parentId
//     })
//
//     this.childrenBlock = React.createRef()
//     this.mainDiv = React.createRef()
//   }
//
//   /*******************************************************
//    * LIFECYCLE
//    *******************************************************/
//   componentDidMount() {
//     if (this.props.showHorizontal) {
//       this.makeDragAndDrop()
//     }
//   }
//
//   componentDidUpdate() {
//     if (this.props.showHorizontal) {
//       this.makeDragAndDrop()
//     }
//   }
//
//   /*******************************************************
//    * FUNCTIONS
//    *******************************************************/
//   makeDragAndDrop() {
//     this.outcomeDragAndDropManager.makeSortableNode(
//       $(this.childrenBlock.current)
//         .children('.outcome-outcome')
//         .not('ui-draggable'),
//       this.props.objectId,
//       'outcomeoutcome',
//       '.outcome-outcome-' + this.props.outcome.data.depth,
//       false,
//       false,
//       '#workflow-' + this.props.workflow.id,
//       '.outcome'
//     )
//     if (this.props.outcome.data.depth === 0) {
//       this.outcomeDragAndDropManager.makeDroppable()
//     }
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const data = this.props.outcome.data
//     let children
//     let outcomehorizontallinks
//     const sideActions = []
//
//     if (Utility.checkSetHidden(data, this.props.outcome.objectSets)) {
//       return null
//     }
//     //Child outcomes. See comment in models/outcome.py for more info.
//     if (data.isDropped) {
//       children = data.childOutcomeLinks.map((outcomeoutcome) => (
//         <OutcomeOutcome
//           key={outcomeoutcome}
//           objectId={outcomeoutcome}
//           parentId={data.id}
//           // renderer={this.context}
//           showHorizontal={this.props.showHorizontal}
//           parentDepth={this.props.outcome.data.depth}
//         />
//       ))
//     }
//
//     if (this.state.showHorizontalLinks) {
//       outcomehorizontallinks = (
//         <div
//           className={'outcome-node-container'}
//           onMouseLeave={() => {
//             this.setState({
//               showHorizontalLinks: false
//             })
//           }}
//         >
//           {data.outcomeHorizontalLinksUnique.map((horizontalLink) => (
//             <OutcomeHorizontalLink
//               key={horizontalLink}
//               objectId={horizontalLink}
//               // renderer={this.context}
//             />
//           ))}
//         </div>
//       )
//     }
//
//     if (
//       this.props.showHorizontal &&
//       data.outcomeHorizontalLinksUnique.length > 0
//     ) {
//       sideActions.push(
//         <div className="outcome-node-indicator">
//           <div
//             className={'outcome-node-indicator-number'}
//             onMouseEnter={() => {
//               this.setState({
//                 showHorizontalLinks: true
//               })
//             }}
//           >
//             {data.outcomeHorizontalLinksUnique.length}
//           </div>
//           {outcomehorizontallinks}
//         </div>
//       )
//     }
//
//     const droptext = data.isDropped
//       ? _t('hide')
//       : _t('show ') +
//         data.childOutcomeLinks.length +
//         ' ' +
//         window.ngettext(
//           'descendant',
//           'descendants',
//           data.childOutcomeLinks.length
//         )
//
//     if (
//       this.props.workflow.workflowPermissions.write &&
//       data.depth < 2 &&
//       data.childOutcomeLinks.length === 0 &&
//       children
//     ) {
//       children.push(
//         <div
//           className="outcome-outcome"
//           style={{
//             height: '5px'
//           }}
//         />
//       )
//     }
//
//     const style: React.CSSProperties = {}
//     if (data.lock) {
//       style.border = '2px solid ' + data.lock.userColour
//     }
//
//     const cssClass = [
//       'outcome outcome-' + data.id,
//       data.isDropped ? ' dropped' : '',
//       data.lock ? 'locked locked-' + data.lock.userId : ''
//     ].join(' ')
//
//     return (
//       <>
//         {
//           // Portal
//           //          this.addEditable(data)
//         }
//         <div
//           style={style}
//           className={cssClass}
//           ref={this.mainDiv}
//           onClick={(e) => {
//             e.stopPropagation()
//             this.manager.updateSidebar(
//               data.id,
//               this.objectType,
//               this.props.parentId
//             )
//           }}
//         >
//           <div className="outcome-title">
//             <OutcomeTitle
//               title={this.props.outcome.data.title}
//               prefix={this.props.outcome.prefix}
//               hovertext={this.props.outcome.hovertext}
//             />
//           </div>
//
//           {data.depth < 2 && data.childOutcomeLinks.length > 0 && (
//             <div
//               className="outcome-drop"
//               onClick={(evt) => {
//                 evt.stopPropagation()
//                 this.manager.toggleDropReduxAction({
//                   objectId: this.props.objectId,
//                   objectType: Constants.objectDictionary[
//                     this.objectType
//                   ] as CfObjectType,
//                   newDropState: !this.props.outcome.data?.isDropped
//                 })
//               }}
//             >
//               <div className="outcome-drop-img">
//                 <ArrowDropDownIcon />
//               </div>
//               <div className="outcome-drop-text">{droptext}</div>
//             </div>
//           )}
//
//           {data.depth < 2 && (
//             <ol
//               className={
//                 'children-block children-block-' + this.props.outcome.data.depth
//               }
//               id={this.props.objectId + '-children-block'}
//               ref={this.childrenBlock}
//             >
//               {children}
//             </ol>
//           )}
//
//           {this.props.workflow.workflowPermissions.write && data.depth < 2 && (
//             <div
//               className="outcome-create-child"
//               onClick={
//                 () => {}
//                 // @todo update this with mutation
//                 // insertChild({
//                 //   id: this.props.objectId,
//                 //   objectType: this.objectType
//                 // })
//               }
//             >
//               {_t('+ Add New')}
//             </div>
//           )}
//
//           <HoverMenu
//             canWrite={this.props.workflow.workflowPermissions.write}
//             canComment={this.props.workflow.workflowPermissions.addComments}
//             objectId={this.props.objectId}
//             parentId={this.props.parentId}
//             objectType={this.objectType}
//           />
//
//           <div className="side-actions">
//             {sideActions}
//             <div className="comment-indicator-container" />
//           </div>
//         </div>
//       </>
//     )
//   }
// }
//
// const mapStateToProps = (
//   state: AppState,
//   ownProps: OwnProps
// ): ConnectedProps => {
//   return {
//     outcome: getOutcomeByID(state, ownProps.objectId),
//     workflow: state.workflow
//   }
// }
//
// /*******************************************************
//  * CONNECT REDUX
//  *******************************************************/
// const Outcome = connect<ConnectedProps, object, OwnProps, AppState>(
//   mapStateToProps,
//   null
// )(OutcomeUnconnected)
//
// export default Outcome
