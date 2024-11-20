import useHover from '@cf/hooks/useHover'
import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import Utility, { _t } from '@cf/utility/Utility.class'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
// import { HoverMenu } from '@cfEditableComponents/hoverEditActions'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { selectNodeById } from '@cfRedux/selectors/node.selector'
import { nodeChangeField } from '@cfRedux/slices/node.slice'
import { AppState } from '@cfRedux/types/type'
import OutcomeNode from '@cfViews/common/OutcomeNode'
import AutoLink from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/AutoLink'
import NodeLink from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeLink'
import NodeTitle from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeTitle'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import { updateOutcomenodeDegree } from '@XMLHTTP/API/update'
import clsx from 'clsx'
import mergeRefs from 'merge-refs'
import React, { useEffect, useRef, useState } from 'react'
import * as reactDom from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'

import NodePorts from 'components/views/WorkflowView/componentViews/WorkflowEditView/components/node/NodePorts'

// Component Props
type OwnProps = {
  objectId: number
  parentId: number
  columnOrder: number[]
  objectSets?: any
}

const choices = COURSEFLOW_APP.globalContextData.workflowChoices

type Args = {
  objectId: number
}

class DragAndDropManager {
  private args: Args
  constructor(args: Args) {
    this.args = args
  }

  makeDroppable = (droppableBlock: JQuery<HTMLElement>) => {
    droppableBlock.droppable({
      tolerance: 'pointer',
      over: (e, ui) => {
        const dropItem = $(e.target)
        const dragItem = ui.draggable
        if (dragItem.hasClass('outcome')) {
          ui.helper.addClass('valid-drop')
          dropItem.addClass('outcome-drop-over')
        }
      },
      out: (e, ui) => {
        const dragItem = ui.draggable
        const dropItem = $(e.target)
        if (dragItem.hasClass('outcome')) {
          ui.helper.removeClass('valid-drop')
          dropItem.removeClass('outcome-drop-over')
        }
      },
      drop: (e, ui) => {
        $('.outcome-drop-over').removeClass('outcome-drop-over')
        if (ui.draggable.hasClass('outcome')) {
          COURSEFLOW_APP.tinyLoader.startLoad()
          updateOutcomenodeDegree(
            this.args.objectId,
            ui.draggable[0].dataDraggable.outcome,
            1,
            () => {
              COURSEFLOW_APP.tinyLoader.endLoad()
            }
          )
        }
      }
    })
  }
}

const Node = ({ objectId, parentId, columnOrder, objectSets }: OwnProps) => {
  /*******************************************************
   * HOOKS: REDUX
   *******************************************************/
  const dispatch = useDispatch()
  const nodeData = useSelector((state: AppState) =>
    selectNodeById(state, objectId)
  )
  const workflow = useSelector((state: AppState) => state.workflow)

  /*******************************************************
   * HOOKS: REF
   *******************************************************/
  const mainDiv = useRef<HTMLDivElement>(null)
  const manager = new BetterSelectionManager(dispatch)

  /*******************************************************
   * HOOKS: STATE
   *******************************************************/
  const [initialRender, setInitialRender] = useState(true)
  const [showOutcomes, setShowOutcomes] = useState(false)
  const [ref, isHovered] = useHover()

  /*******************************************************
   * HOOKS: LIFECYCLE
   *******************************************************/
  useEffect(() => {
    if (initialRender) {
      setInitialRender(false)
    }
    // const dragNdrop = new DragAndDropManager({ objectId })
    // dragNdrop.makeDroppable($(mainDiv.current))

    updateHidden()

    const component = mainDiv.current
    if (component) {
      component.addEventListener('dblclick', doubleClick)
    }

    return () => {
      if (component) {
        component.removeEventListener('dblclick', doubleClick)
      }
    }
  }, [])

  useEffect(() => {
    updatePorts()
    updateHidden()
  }, [nodeData])

  useEffect(() => {
    renderNodePorts()
  }, [initialRender, isHovered, objectId, mainDiv, dispatch])

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  const updateHidden = () => {
    if ($(mainDiv.current).css('display') === 'none') {
      const week = $(mainDiv.current).parent('.node-week').parent()
      if (week.children('.node-week:not(.empty)').length > 1) {
        $(mainDiv.current).parent('.node-week').addClass('empty')
      }
    } else {
      $(mainDiv.current).parent('.nodeweek').removeClass('empty')
    }
  }

  const updatePorts = () => {
    $(mainDiv.current).triggerHandler('component-updated')
  }

  const doubleClick = (evt: MouseEvent) => {
    evt.stopPropagation()
    console.log('navigate to workflow')
  }

  function dropText(dataOverride) {
    if (
      dataOverride.description &&
      dataOverride.description.replace(
        /(<p>|<\/p>|<br>|\n| |[^a-zA-Z0-9])/g,
        ''
      ) != ''
    ) {
      return '...'
    }
    return ''
  }
  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const ContextIcon = () => {
    const data = nodeData.node
    if (data.contextClassification <= 0) {
      return null
    }

    return (
      <div className="node-icon">
        <img
          title={
            choices.contextChoices.find(
              (obj) => obj.type === data.contextClassification
            )?.name
          }
          src={`${apiPaths.external.static_assets.icon}${Constants.contextKeys[data.contextClassification]}.svg`}
        />
      </div>
    )
  }

  const TaskIcon = () => {
    const data = nodeData.node
    if (data.taskClassification <= 0) {
      return null
    }

    return (
      <div className="node-icon">
        <img
          title={
            choices.taskChoices.find(
              (obj) => obj.type === data.taskClassification
            )?.name
          }
          src={`${apiPaths.external.static_assets.icon}${Constants.taskKeys[data.taskClassification]}.svg`}
        />
      </div>
    )
  }

  const OutcomeNodes = () => {
    const node = nodeData.node

    if (!showOutcomes) {
      return <></>
    }

    return (
      <div
        className={'outcome-node-container column-' + node.column}
        onMouseLeave={() => {
          setShowOutcomes(false)
        }}
        style={{
          borderColor: ThemeHelper.getColumnColour({
            columnType: node.column.columnType,
            colour: node.column.colour
          })
        }}
      >
        {node.outcomenodeUniqueSet.map((outcomenode) => (
          <OutcomeNode key={outcomenode} objectId={outcomenode} />
        ))}
      </div>
    )
  }

  const SideActions = () => {
    const node = nodeData.node

    if (node.outcomenodeUniqueSet.length <= 0) {
      return <></>
    }
    return (
      <div className="outcome-node-indicator">
        <div
          className={'outcome-node-indicator-number column-' + node.column}
          onMouseEnter={() => {
            setShowOutcomes(true)
          }}
          style={{
            borderColor: ThemeHelper.getColumnColour({
              columnType: node.column.columnType,
              colour: node.column.colour
            })
          }}
        >
          {node.outcomenodeUniqueSet.length}
        </div>
        <OutcomeNodes />
      </div>
    )
  }

  /**
   * Icon link to the linked workflow by reference
   **/
  const LinkIcon = ({ data }: { data: any }) => {
    if (!data.linkedWorkflow) {
      return <></>
    }

    const noAccess =
      !data.linkedWorkflowData ||
      data.linkedWorkflowData.url == 'noaccess' ||
      data.linkedWorkflowData.url == 'nouser' ||
      data.linkedWorkflowData.deleted

    function clickHandler(evt) {
      evt.stopPropagation()

      if (noAccess) {
        return
      }

      console.log('navigate to workflow')
      // navigate to workflow action goes here
    }

    function linkText() {
      // not sure we care about this distinction TBH
      // but we could rexpand the noaccess check above
      if (noAccess) {
        //  note these are not components
        return '<Inaccessible >' //
        //        return '<Deleted>'
      }

      return _t('Visit workflow')
    }

    return (
      <div
        className={clsx('linked-workflow', {
          ['link-noaccess']: noAccess,
          ['hover-shade']: !noAccess
        })}
        onClick={clickHandler}
      >
        <img src={apiPaths.external.static_assets.icon + 'wflink.svg'} />
        <div>{linkText()}</div>
      </div>
    )
  }

  /*******************************************************
   * PORTAL
   * @todo...
   *******************************************************/
  let nodePorts
  let nodeLinks
  let autoLink
  const renderNodePorts = () => {
    if (!initialRender) {
      console.log('render node ports again!')
      // this is dynamic see: react/src/components/views/WorkflowView/WorkflowView.tsx

      /*******************************************************
       *   can't figure out how to break this out of portal yet
       *   node ports are caclucated from the beginning of the canvas  and get lost
       *   might not be worth it to figure it out since the underlying d3 / canvas system will go at some point
       *******************************************************/
      nodePorts = reactDom.createPortal(
        <NodePorts
          show={isHovered}
          nodeId={objectId}
          nodeDiv={mainDiv}
          dispatch={dispatch}
        />,
        $('.workflow-canvas')[0]
      )

      nodeLinks = node.outgoingLinks.map((link) => (
        <NodeLink key={link} objectId={link} nodeDiv={mainDiv} />
      ))
      if (node.hasAutolink) {
        autoLink = <AutoLink nodeId={objectId} nodeDiv={mainDiv} />
      }
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  const style: React.CSSProperties = {
    left: `${Constants.columnwidth * (nodeData.column.order + 1)}px`,
    backgroundColor: ThemeHelper.getColumnColour(nodeData.column),
    display: Utility.checkSetHidden(nodeData.node, objectSets)
      ? 'none'
      : undefined,
    outline: nodeData.node.lock
      ? `2px solid ${nodeData.node.lock.userColour}`
      : undefined
  }
  const node = nodeData.node
  const dataOverride = node.representsWorkflow
    ? { ...node, ...node.linkedWorkflowData, id: node.id }
    : { ...node }

  const dropIcon = node.isDropped ? <ArrowDropDownIcon /> : <ArrowDropUpIcon />

  return (
    <>
      <div
        id={String(nodeData.node.id)}
        style={style}
        className={clsx(
          'node',
          `column-${nodeData.node.column}`,
          Constants.nodeKeys[nodeData.node.nodeType],
          {
            dropped: nodeData.node.isDropped,
            [`locked locked-${nodeData.node.lock?.userId}`]: nodeData.node.lock
          }
        )}
        data-hovered={isHovered}
        ref={mergeRefs(mainDiv, ref)}
        onClick={(e) => {
          e.stopPropagation()
          manager.updateSidebar(nodeData.node.id, CfObjectType.NODE, parentId)
        }}
      >
        <div className="node-top-row">
          <ContextIcon />
          <NodeTitle node={nodeData.node} />
          <TaskIcon />
        </div>

        <LinkIcon data={dataOverride} />

        <div className="node-details">
          <TitleText
            text={dataOverride.description}
            defaultText={_t('Click to edit')}
          />
        </div>

        <div
          className="node-drop-row hover-shade"
          onClick={(evt) => {
            evt.stopPropagation()
            dispatch(
              nodeChangeField({
                id: objectId,
                data: { isDropped: !nodeData.node.isDropped }
              })
            )
          }}
        >
          <div className="node-drop-side node-drop-left">
            {dropText(dataOverride)}

            <div className="node-drop-middle">{dropIcon}</div>

            <div className="node-drop-side node-drop-right">
              <div className="node-drop-time">
                {dataOverride.timeRequired &&
                  `${dataOverride.timeRequired} ${choices.timeChoices[dataOverride.timeUnits].name}`}
              </div>
            </div>
          </div>
        </div>



        <div className="side-actions">
          <SideActions />
          <div className="comment-indicator-container"></div>
          <div className="assignment-indicator-container"></div>
        </div>
      </div>
      {renderNodePorts()}
      {nodePorts}
      {nodeLinks}
      {autoLink}
    </>
  )
}

export default Node

// import { apiPaths } from '@cf/router/apiRoutes'
// import { CfObjectType } from '@cf/types/enum'
// import * as Constants from '@cf/utility/constants'
// import ThemeHelper from '@cf/utility/ThemeHelper.class'
// import { _t } from '@cf/utility/Utility.class'
// import Utility from '@cf/utility/Utility.class'
// import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
// import { HoverMenu } from '@cfEditableComponents/hoverEditActions'
// import { TGetNodeById, getNodeByID } from '@cfFindState'
// import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
// import { AppState, TWorkflow } from '@cfRedux/types/type'
// import OutcomeNode from '@cfViews/common/OutcomeNode'
// import AutoLink from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/AutoLink'
// import NodeLink from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeLink'
// import NodeTitle from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeTitle'
// import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
// import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
// import { Dispatch } from '@reduxjs/toolkit'
// import { updateOutcomenodeDegree } from '@XMLHTTP/API/update'
// import clsx from 'clsx'
// import * as React from 'react'
// import * as reactDom from 'react-dom'
// import { connect } from 'react-redux'
// import { Action } from 'redux'
//
// import NodePorts from 'components/views/WorkflowView/componentViews/WorkflowEditView/components/node/NodePorts'
//
// type ConnectedProps = {
//   node: TGetNodeById
//   workflow: TWorkflow
// }
//
// type OwnProps = {
//   objectId: number
//   parentId: number
//   columnOrder: any
//   objectSets?: any // where is this coming from
// } & { dispatch?: Dispatch<Action> }
//
// type StateProps = {
//   initialRender: boolean
//   showOutcomes: boolean
//   hovered: boolean
// }
//
// type PropsType = ConnectedProps & OwnProps
//
// const choices = COURSEFLOW_APP.globalContextData.workflowChoices
//
// /**
//  * Represents the node in the workflow view
//  */
// class NodeUnconnected extends React.Component<PropsType, StateProps> {
//   private manager: BetterSelectionManager
//   private mainDiv: React.RefObject<HTMLDivElement>
//   private objectType: CfObjectType
//
//   constructor(props: PropsType) {
//     super(props)
//
//     this.mainDiv = React.createRef()
//
//     this.manager = new BetterSelectionManager(props.dispatch)
//     this.objectType = CfObjectType.NODE
//
//     this.state = {
//       initialRender: true,
//       showOutcomes: false,
//       hovered: false
//     } as StateProps
//   }
//
//   /*******************************************************
//    * LIFECYCLE
//    *******************************************************/
//   componentDidMount() {
//     if (this.state.initialRender) {
//       this.setState({
//         initialRender: false
//       })
//     }
//
//     this.makeDroppable()
//     this.updateHidden()
//
//     const component = this.mainDiv.current
//     if (component) {
//       component.addEventListener('mouseenter', this.mouseIn.bind(this))
//       component.addEventListener('mouseleave', this.mouseLeave.bind(this))
//     }
//     this.mainDiv.current.addEventListener(
//       'dblclick',
//       this.doubleClick.bind(this)
//     )
//   }
//
//   componentWillUnmount() {
//     const component = this.mainDiv.current
//     if (component) {
//       // Unbind with native event type
//       component.removeEventListener('mouseenter', this.mouseIn.bind(this))
//       component.removeEventListener('mouseleave', this.mouseLeave.bind(this))
//     }
//     this.mainDiv.current.removeEventListener(
//       'dblclick',
//       this.doubleClick.bind(this)
//     )
//   }
//
//   componentDidUpdate(prevProps, prevState) {
//     if (this.props.nodeData.node.isDropped == prevProps.nodeData.node.isDropped) {
//       this.updatePorts()
//     } else {
//       ThemeHelper.triggerHandlerEach($('.node'), 'component-updated')
//     }
//     this.updateHidden()
//   }
//
//   /*******************************************************
//    * FUNCTIONS
//    *******************************************************/
//
//   //WHY?: Checks to see if we should mark this as empty. We don't want to do this if it's the only node in the week.
//   updateHidden() {
//     if ($(this.mainDiv.current).css('display') == 'none') {
//       const week = $(this.mainDiv.current).parent('.node-week').parent()
//       if (week.children('.node-week:not(.empty)').length > 1) {
//         $(this.mainDiv.current).parent('.node-week').addClass('empty')
//       }
//     } else {
//       $(this.mainDiv.current).parent('.nodeweek').removeClass('empty')
//     }
//   }
//
//   updatePorts() {
//     $(this.mainDiv.current).triggerHandler('component-updated') // what is for ...
//   }
//
//   doubleClick(evt) {
//     evt.stopPropagation()
//     console.log('navigate to workflow')
//     // some kind of code to navigate to the referended workflow
//   }
//
//   /*******************************************************
//    * FUNCTIONS: HANDLERS
//    *******************************************************/
//
//   /*******************************************************
//    * MOUSE HOVER
//    *******************************************************/
//   mouseIn(_evt: MouseEvent): void {
//     if (!this.props.workflow.workflowPermissions.write) {
//       return
//     }
//     if (!this.state.hovered) {
//       this.setState({ hovered: true })
//     }
//   }
//
//   mouseLeave(_evt: MouseEvent): void {
//     this.setState({ hovered: false })
//   }
//
//   makeDroppable() {
//     $(this.mainDiv.current).droppable({
//       tolerance: 'pointer',
//       droppable: '.outcome-ghost',
//       over: (e, ui) => {
//         const dropItem = $(e.target)
//         const dragItem = ui.draggable
//         const dragHelper = ui.helper
//         const newIndex = dropItem.prevAll().length
//         const newParentId = parseInt(dropItem.parent().attr('id'))
//
//         if (dragItem.hasClass('outcome')) {
//           dragHelper.addClass('valid-drop')
//           dropItem.addClass('outcome-drop-over')
//           return
//         } else {
//           return
//         }
//       },
//       out: (e, ui) => {
//         const dragItem = ui.draggable
//         const dragHelper = ui.helper
//         const dropItem = $(e.target)
//         if (dragItem.hasClass('outcome')) {
//           dragHelper.removeClass('valid-drop')
//           dropItem.removeClass('outcome-drop-over')
//         }
//       },
//       drop: (e, ui) => {
//         $('.outcome-drop-over').removeClass('outcome-drop-over')
//         const dragItem = ui.draggable
//         if (dragItem.hasClass('outcome')) {
//           COURSEFLOW_APP.tinyLoader.startLoad()
//
//           // @todo HACK, this is being used to bypass react and pass information around the DOM
//           updateOutcomenodeDegree(
//             this.props.objectId,
//             // @ts-ignore // data draggable is custom /HACK
//             dragItem[0].dataDraggable.outcome,
//             1,
//             (responseData) => {
//               COURSEFLOW_APP.tinyLoader.endLoad()
//             }
//           )
//         }
//       }
//     })
//   }
//
//   dropText(dataOverride) {
//     if (
//       dataOverride.description &&
//       dataOverride.description.replace(
//         /(<p>|<\/p>|<br>|\n| |[^a-zA-Z0-9])/g,
//         ''
//       ) != ''
//     ) {
//       return '...'
//     }
//     return ''
//   }
//
//   /*******************************************************
//    * COMPONENTS
//    *******************************************************/
//   ContextIcon = () => {
//     const data = this.props.nodeData.node
//     if (data.contextClassification <= 0) {
//       return <></>
//     }
//
//     return (
//       <div className="node-icon">
//         <img
//           title={
//             choices.contextChoices.find(
//               (obj) => obj.type == data.contextClassification
//             ).name
//           }
//           src={
//             apiPaths.external.static_assets.icon +
//             Constants.contextKeys[data.contextClassification] +
//             '.svg'
//           }
//         />
//       </div>
//     )
//   }
//
//   TaskIcon = () => {
//     const data = this.props.nodeData.node
//     if (data.taskClassification <= 0) {
//       return <></>
//     }
//
//     return (
//       <div className="node-icon">
//         <img
//           title={
//             choices.taskChoices.find(
//               (obj) => obj.type === data.taskClassification
//             )?.name
//           }
//           src={
//             apiPaths.external.static_assets.icon +
//             Constants.taskKeys[data.taskClassification] +
//             '.svg'
//           }
//         />
//       </div>
//     )
//   }
//
//   OutcomeNodes = () => {
//     const data = this.props.nodeData.node
//
//     if (!this.state.showOutcomes) {
//       return <></>
//     }
//
//     return (
//       <div
//         className={'outcome-node-container column-' + data.column}
//         onMouseLeave={() => {
//           this.setState({ showOutcomes: false })
//         }}
//         style={{
//           borderColor: ThemeHelper.getColumnColour({
//             columnType: this.props.node.column.columnType,
//             colour: this.props.node.column.colour
//           })
//         }}
//       >
//         {data.outcomenodeUniqueSet.map((outcomenode) => (
//           <OutcomeNode key={outcomenode} objectId={outcomenode} />
//         ))}
//       </div>
//     )
//   }
//
//   SideActions = () => {
//     const data = this.props.nodeData.node
//
//     if (data.outcomenodeUniqueSet.length <= 0) {
//       return <></>
//     }
//     return (
//       <div className="outcome-node-indicator">
//         <div
//           className={'outcome-node-indicator-number column-' + data.column}
//           onMouseEnter={() => {
//             this.setState({ showOutcomes: true })
//           }}
//           style={{
//             borderColor: ThemeHelper.getColumnColour({
//               columnType: this.props.node.column.columnType,
//               colour: this.props.node.column.colour
//             })
//           }}
//         >
//           {data.outcomenodeUniqueSet.length}
//         </div>
//         <this.OutcomeNodes />
//       </div>
//     )
//   }
//
//   LinkIcon = ({ data }: { data: any }) => {
//     if (!data.linkedWorkflow) {
//       return <></>
//     }
//
//     let linkText = _t('Visit workflow')
//     let linkClass = 'linked-workflow'
//
//     let clickfunc = this.doubleClick.bind(this)
//
//     if (data.linkedWorkflowData) {
//       if (
//         data.linkedWorkflowData.url == 'noaccess' ||
//         data.linkedWorkflowData.url == 'nouser'
//       ) {
//         linkText = _t('<Inaccessible>')
//         clickfunc = null
//         linkClass += ' link-noaccess'
//       } else if (data.linkedWorkflowData.deleted) {
//         linkText = _t('<Deleted>')
//         clickfunc = null
//         linkClass += ' link-noaccess'
//       } else {
//         linkClass += ' hover-shade'
//       }
//     }
//
//     return (
//       <div className={linkClass} onClick={clickfunc}>
//         <img src={apiPaths.external.static_assets.icon + 'wflink.svg'} />
//         <div>{linkText}</div>
//       </div>
//     )
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     let nodeLinks
//     let autoLink
//
//     const data = this.props.nodeData.node
//     const dataOverride = data.representsWorkflow
//       ? { ...data, ...data.linkedWorkflowData, id: data.id }
//       : { ...data }
//
//     const dropIcon = data.isDropped ? (
//       <ArrowDropDownIcon />
//     ) : (
//       <ArrowDropUpIcon />
//     )
//
//     let nodePorts
//     if (!this.state.initialRender) {
//       // this is dynamic see: react/src/components/views/WorkflowView/WorkflowView.tsx
//
//       /*******************************************************
//        *   can't figure out how to break this out of portal yet
//        *   node ports are caclucated from the beginning of the canvas  and get lost
//        *   might not be worth it to figure it out since the underlying d3 / canvas system will go at some point
//        *******************************************************/
//       nodePorts = reactDom.createPortal(
//         <NodePorts
//           show={this.state.hovered}
//           nodeId={this.props.objectId}
//           nodeDiv={this.mainDiv}
//           dispatch={this.props.dispatch}
//         />,
//         $('.workflow-canvas')[0]
//       )
//
//       nodeLinks = data.outgoingLinks.map((link) => (
//         <NodeLink key={link} objectId={link} nodeDiv={this.mainDiv} />
//       ))
//       if (data.hasAutolink) {
//         autoLink = (
//           <AutoLink nodeId={this.props.objectId} nodeDiv={this.mainDiv} />
//         )
//       }
//     }
//
//     const style: React.CSSProperties = {
//       left:
//         Constants.columnwidth * this.props.columnOrder.indexOf(data.column) +
//         'px',
//       backgroundColor: ThemeHelper.getColumnColour({
//         columnType: this.props.node.column.columnType,
//         colour: this.props.node.column.colour
//       })
//     }
//
//     if (data.lock) {
//       style.outline = '2px solid ' + data.lock.userColour
//     }
//
//     if (Utility.checkSetHidden(data, this.props.objectSets)) {
//       style.display = 'none'
//     }
//
//     return (
//       <>
//         <div
//           id={String(data.id)}
//           style={style}
//           className={clsx(
//             'node',
//             `column-${data.column}`,
//             Constants.nodeKeys[data.nodeType],
//             {
//               dropped: data.isDropped,
//               [`locked locked-${data.lock?.userId}`]: data.lock
//             }
//           )}
//           ref={this.mainDiv}
//           // @todo we probably this shuld go through redux also
//           // that way we select a UI item 'remotely'
//           // data-selected={this.state.selected}
//           //          data-hovered={this.state.hovered}
//           data-hovered={this.state.hovered}
//           onClick={(e) => {
//             e.stopPropagation()
//             this.manager.updateSidebar(
//               data.id,
//               CfObjectType.NODE,
//               this.props.parentId
//             )
//           }}
//         >
//           <div className="node-top-row">
//             <this.ContextIcon />
//             <NodeTitle node={data} />
//             <this.TaskIcon />
//           </div>
//
//           <this.LinkIcon data={dataOverride} />
//
//           <div className="node-details">
//             <TitleText
//               text={dataOverride.description}
//               defaultText={_t('Click to edit')}
//             />
//           </div>
//
//           <div
//             className="node-drop-row hover-shade"
//             onClick={(evt) => {
//               evt.stopPropagation()
//               this.manager.toggleDropReduxAction({
//                 objectId: this.props.objectId,
//                 objectType: this.objectType,
//                 newDropState: !this.props.nodeData.node?.isDropped,
//                 depth: this.props.nodeData.node?.depth // where is depth defined?
//               })
//             }}
//           >
//             <div className="node-drop-side node-drop-left">
//               {this.dropText(dataOverride)}
//             </div>
//
//             <div className="node-drop-middle">{dropIcon}</div>
//
//             <div className="node-drop-side node-drop-right">
//               <div className="node-drop-time">
//                 {dataOverride.timeRequired &&
//                   dataOverride.timeRequired +
//                     ' ' +
//                     choices.timeChoices[dataOverride.timeUnits].name}
//               </div>
//             </div>
//           </div>
//
//           <HoverMenu
//             canWrite={this.props.workflow.workflowPermissions.write}
//             canComment={this.props.workflow.workflowPermissions.viewComments}
//             objectId={this.props.objectId}
//             parentId={this.props.parentId}
//             objectType={this.objectType}
//           />
//
//           {nodePorts}
//           {nodeLinks}
//           {autoLink}
//
//           <div className="side-actions">
//             <this.SideActions />
//             <div className="comment-indicator-container"></div>
//             <div className="assignment-indicator-container"></div>
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
//     workflow: state.workflow,
//     node: getNodeByID(state, ownProps.objectId)
//   }
// }
//
// const Node = connect<ConnectedProps, object, OwnProps, AppState>(
//   mapStateToProps,
//   null
// )(NodeUnconnected)
//
// export default Node
