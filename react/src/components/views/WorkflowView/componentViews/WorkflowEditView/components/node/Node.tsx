import useHover from '@cf/hooks/useHover'
import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import Utility, { _t } from '@cf/utility/Utility.class'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { selectColumnById } from '@cfRedux/selectors/column.selector'
import { selectNodeById } from '@cfRedux/selectors/node.selector'
import { nodeChangeField } from '@cfRedux/slices/node.slice'
import { RootState } from '@cfRedux/store'
import { TNode } from '@cfRedux/types/type'
import OutcomeNode from '@cfViews/common/OutcomeNode'
import Autolink from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/Autolink'
import Nodelink from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/Nodelink'
import NodeTitle from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeTitle'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
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
  objectSets?: any
}

const choices = COURSEFLOW_APP.globalContextData.workflowChoices

type Args = {
  objectId: number
}

const Node = ({ objectId, parentId, objectSets }: OwnProps) => {
  /*******************************************************
   * HOOKS: REDUX
   *******************************************************/
  const dispatch = useDispatch()
  const node = useSelector((state: RootState) =>
    selectNodeById(state, objectId)
  )
  const column = useSelector((state: RootState) =>
    selectColumnById(state, node.column)
  )
  const workflow = useSelector((state: RootState) => state.workspace.workflow)

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
  }, [node])

  useEffect(() => {
    renderNodePorts()
  }, [initialRender, objectId, mainDiv, dispatch])

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
    const data = node
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
    const data = node
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
            ...column
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
              columnType: column.columnType,
              colour: column.colour
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
  const LinkIcon = ({ data }: { data: TNode }) => {
    // @todo
    if (!data.linkedWorkflow || true) {
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

      console.log('navigate to workflow') // navigate to workflow action goes here
    }

    function linkText() {
      if (noAccess) {
        return '<Inaccessible >' // not a component
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
        <LinkIcon />
        <div>{linkText()}</div>
      </div>
    )
  }

  /*******************************************************
   * PORTAL
   * @todo...
   *******************************************************/
  let nodePorts
  let nodelinks
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

      nodelinks = node.outgoingLinks.map((link) => (
        <Nodelink key={link} objectId={link} nodeDiv={mainDiv} />
      ))
      if (node.hasAutolink) {
        autoLink = <Autolink nodeId={objectId} nodeDiv={mainDiv} />
      }
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  const style: React.CSSProperties = {
    //    left: `${Constants.columnwidth * (column.order + 1)}px`,
    backgroundColor: ThemeHelper.getColumnColour({
      ...column
    }),
    display: Utility.checkSetHidden(node, objectSets) ? 'none' : undefined,
    outline: node.lock ? `2px solid ${node.lock.userColour}` : undefined
  }
  // @todo still bad
  const dataOverride: TNode = node.representsWorkflow
    ? { ...node, ...node.linkedWorkflowData, id: node.id }
    : { ...node }

  const dropIcon = node.isDropped ? <ArrowDropDownIcon /> : <ArrowDropUpIcon />

  return (
    <>
      <div
        id={String(node.id)}
        style={style}
        className={clsx(
          'node',
          `column-${node.column}`,
          Constants.nodeKeys[node.nodeType],
          {
            dropped: node.isDropped,
            [`locked locked-${node.lock?.userId}`]: node.lock
          }
        )}
        data-hovered={isHovered}
        ref={mergeRefs(mainDiv, ref)}
        onClick={(e) => {
          e.stopPropagation()
          manager.updateSidebar(node.id, CfObjectType.NODE, parentId)
        }}
      >
        <div className="node-top-row">
          <ContextIcon />
          <NodeTitle node={node} />
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
                data: { isDropped: !node.isDropped }
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
      {nodelinks}
      {autoLink}
    </>
  )
}

export default Node
