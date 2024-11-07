import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import Utility from '@cf/utility/Utility.class'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import { HoverMenu } from '@cfEditableComponents/hoverEditActions'
import { TGetNodeById, getNodeByID } from '@cfFindState'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import OutcomeNode from '@cfViews/common/OutcomeNode'
import AutoLink from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/AutoLink'
import NodeLink from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeLink'
import NodeTitle from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeTitle'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import { Dispatch } from '@reduxjs/toolkit'
import { updateOutcomenodeDegree } from '@XMLHTTP/API/update'
import clsx from 'clsx'
import * as React from 'react'
import * as reactDom from 'react-dom'
import { connect } from 'react-redux'
import { Action } from 'redux'

import NodePorts from 'components/views/WorkflowView/componentViews/WorkflowEditView/components/node/NodePorts'

type ConnectedProps = {
  node: TGetNodeById
  workflow: TWorkflow
}

type OwnProps = {
  objectId: number
  parentId: number
  columnOrder: any
  objectSets?: any // where is this coming from
} & { dispatch?: Dispatch<Action> }

type StateProps = {
  initialRender: boolean
  showOutcomes: boolean
  hovered: boolean
}

type PropsType = ConnectedProps & OwnProps

const choices = COURSEFLOW_APP.globalContextData.workflowChoices

/**
 * Represents the node in the workflow view
 */
class NodeUnconnected extends React.Component<PropsType, StateProps> {
  private manager: BetterSelectionManager
  private mainDiv: React.RefObject<HTMLDivElement>
  private objectType: CfObjectType

  constructor(props: PropsType) {
    super(props)

    this.mainDiv = React.createRef()

    this.manager = new BetterSelectionManager(props.dispatch)
    this.objectType = CfObjectType.NODE

    this.state = {
      initialRender: true,
      showOutcomes: false,
      hovered: false
    } as StateProps
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    if (this.state.initialRender) {
      this.setState({
        initialRender: false
      })
    }

    this.makeDroppable()
    this.updateHidden()

    const component = this.mainDiv.current
    if (component) {
      component.addEventListener('mouseenter', this.mouseIn.bind(this))
      component.addEventListener('mouseleave', this.mouseLeave.bind(this))
    }
    this.mainDiv.current.addEventListener(
      'dblclick',
      this.doubleClick.bind(this)
    )
  }

  componentWillUnmount() {
    const component = this.mainDiv.current
    if (component) {
      // Unbind with native event type
      component.removeEventListener('mouseenter', this.mouseIn.bind(this))
      component.removeEventListener('mouseleave', this.mouseLeave.bind(this))
    }
    this.mainDiv.current.removeEventListener(
      'dblclick',
      this.doubleClick.bind(this)
    )
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.node.data.isDropped == prevProps.node.data.isDropped) {
      this.updatePorts()
    } else {
      ThemeHelper.triggerHandlerEach($('.node'), 'component-updated')
    }
    this.updateHidden()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  //WHY?: Checks to see if we should mark this as empty. We don't want to do this if it's the only node in the week.
  updateHidden() {
    if ($(this.mainDiv.current).css('display') == 'none') {
      const week = $(this.mainDiv.current).parent('.node-week').parent()
      if (week.children('.node-week:not(.empty)').length > 1) {
        $(this.mainDiv.current).parent('.node-week').addClass('empty')
      }
    } else {
      $(this.mainDiv.current).parent('.nodeweek').removeClass('empty')
    }
  }

  updatePorts() {
    $(this.mainDiv.current).triggerHandler('component-updated') // what is for ...
  }

  doubleClick(evt) {
    evt.stopPropagation()
    console.log('navigate to workflow')
    // some kind of code to navigate to the referended workflow
  }

  /*******************************************************
   * FUNCTIONS: HANDLERS
   *******************************************************/

  /*******************************************************
   * MOUSE HOVER
   *******************************************************/
  mouseIn(_evt: MouseEvent): void {
    if (!this.props.workflow.workflowPermissions.write) {
      return
    }
    this.setState({ hovered: true })
  }

  mouseLeave(_evt: MouseEvent): void {
    this.setState({ hovered: false })
  }

  makeDroppable() {
    $(this.mainDiv.current).droppable({
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
        const dragItem = ui.draggable
        if (dragItem.hasClass('outcome')) {
          COURSEFLOW_APP.tinyLoader.startLoad()

          // @todo HACK, this is being used to bypass react and pass information around the DOM
          updateOutcomenodeDegree(
            this.props.objectId,
            // @ts-ignore // data draggable is custom /HACK
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

  dropText(dataOverride) {
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
  ContextIcon = () => {
    const data = this.props.node.data
    if (data.contextClassification <= 0) {
      return <></>
    }

    return (
      <div className="node-icon">
        <img
          title={
            choices.contextChoices.find(
              (obj) => obj.type == data.contextClassification
            ).name
          }
          src={
            apiPaths.external.static_assets.icon +
            Constants.contextKeys[data.contextClassification] +
            '.svg'
          }
        />
      </div>
    )
  }

  TaskIcon = () => {
    const data = this.props.node.data
    if (data.taskClassification <= 0) {
      return <></>
    }

    return (
      <div className="node-icon">
        <img
          title={
            choices.taskChoices.find(
              (obj) => obj.type === data.taskClassification
            )?.name
          }
          src={
            apiPaths.external.static_assets.icon +
            Constants.taskKeys[data.taskClassification] +
            '.svg'
          }
        />
      </div>
    )
  }

  OutcomeNodes = () => {
    const data = this.props.node.data

    if (!this.state.showOutcomes) {
      return <></>
    }

    return (
      <div
        className={'outcome-node-container column-' + data.column}
        onMouseLeave={() => {
          this.setState({ showOutcomes: false })
        }}
        style={{
          borderColor: ThemeHelper.getColumnColour({
            columnType: this.props.node.column.columnType,
            colour: this.props.node.column.colour
          })
        }}
      >
        {data.outcomenodeUniqueSet.map((outcomenode) => (
          <OutcomeNode key={outcomenode} objectId={outcomenode} />
        ))}
      </div>
    )
  }

  SideActions = () => {
    const data = this.props.node.data

    if (data.outcomenodeUniqueSet.length <= 0) {
      return <></>
    }
    return (
      <div className="outcome-node-indicator">
        <div
          className={'outcome-node-indicator-number column-' + data.column}
          onMouseEnter={() => {
            this.setState({ showOutcomes: true })
          }}
          style={{
            borderColor: ThemeHelper.getColumnColour({
              columnType: this.props.node.column.columnType,
              colour: this.props.node.column.colour
            })
          }}
        >
          {data.outcomenodeUniqueSet.length}
        </div>
        <this.OutcomeNodes />
      </div>
    )
  }

  LinkIcon = ({ data }: { data: any }) => {
    if (!data.linkedWorkflow) {
      return <></>
    }

    let linkText = _t('Visit workflow')
    let linkClass = 'linked-workflow'

    let clickfunc = this.doubleClick.bind(this)

    if (data.linkedWorkflowData) {
      if (
        data.linkedWorkflowData.url == 'noaccess' ||
        data.linkedWorkflowData.url == 'nouser'
      ) {
        linkText = _t('<Inaccessible>')
        clickfunc = null
        linkClass += ' link-noaccess'
      } else if (data.linkedWorkflowData.deleted) {
        linkText = _t('<Deleted>')
        clickfunc = null
        linkClass += ' link-noaccess'
      } else {
        linkClass += ' hover-shade'
      }
    }

    return (
      <div className={linkClass} onClick={clickfunc}>
        <img src={apiPaths.external.static_assets.icon + 'wflink.svg'} />
        <div>{linkText}</div>
      </div>
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let nodeLinks
    let autoLink

    const data = this.props.node.data
    const dataOverride = data.representsWorkflow
      ? { ...data, ...data.linkedWorkflowData, id: data.id }
      : { ...data }

    const dropIcon = data.isDropped ? (
      <ArrowDropDownIcon />
    ) : (
      <ArrowDropUpIcon />
    )

    let nodePorts
    if (!this.state.initialRender) {
      // this is dynamic see: react/src/components/views/WorkflowView/WorkflowView.tsx

      /*******************************************************
       *   can't figure out how to break this out of portal yet
       *   node ports are caclucated from the beginning of the canvas  and get lost
       *   might not be worth it to figure it out since the underlying d3 / canvas system will go at some point
       *******************************************************/
      nodePorts = reactDom.createPortal(
        <NodePorts
          show={this.state.hovered}
          nodeId={this.props.objectId}
          nodeDiv={this.mainDiv}
          dispatch={this.props.dispatch}
        />,
        $('.workflow-canvas')[0]
      )

      nodeLinks = data.outgoingLinks.map((link) => (
        <NodeLink key={link} objectId={link} nodeDiv={this.mainDiv} />
      ))
      if (data.hasAutolink) {
        autoLink = (
          <AutoLink nodeId={this.props.objectId} nodeDiv={this.mainDiv} />
        )
      }
    }

    const style: React.CSSProperties = {
      left:
        Constants.columnwidth * this.props.columnOrder.indexOf(data.column) +
        'px',
      backgroundColor: ThemeHelper.getColumnColour({
        columnType: this.props.node.column.columnType,
        colour: this.props.node.column.colour
      })
    }

    if (data.lock) {
      style.outline = '2px solid ' + data.lock.userColour
    }

    if (Utility.checkSetHidden(data, this.props.objectSets)) {
      style.display = 'none'
    }

    return (
      <>
        <div
          id={String(data.id)}
          style={style}
          className={clsx(
            'node',
            `column-${data.column}`,
            Constants.nodeKeys[data.nodeType],
            {
              dropped: data.isDropped,
              [`locked locked-${data.lock?.userId}`]: data.lock
            }
          )}
          ref={this.mainDiv}
          // @todo we probably this shuld go through redux also
          // that way we select a UI item 'remotely'
          // data-selected={this.state.selected}
          //          data-hovered={this.state.hovered}
          data-hovered={this.state.hovered}
          onClick={(e) => {
            e.stopPropagation()
            this.manager.updateSidebar(
              data.id,
              CfObjectType.NODE,
              this.props.parentId
            )
          }}
        >
          <div className="node-top-row">
            <this.ContextIcon />
            <NodeTitle node={data} />
            <this.TaskIcon />
          </div>

          <this.LinkIcon data={dataOverride} />

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
              this.manager.toggleDropReduxAction({
                objectId: this.props.objectId,
                objectType: this.objectType,
                newDropState: this.props.node.data?.isDropped,
                depth: this.props.node.data?.depth // where is depth defined?
              })
            }}
          >
            <div className="node-drop-side node-drop-left">
              {this.dropText(dataOverride)}
            </div>

            <div className="node-drop-middle">{dropIcon}</div>

            <div className="node-drop-side node-drop-right">
              <div className="node-drop-time">
                {dataOverride.timeRequired &&
                  dataOverride.timeRequired +
                    ' ' +
                    choices.timeChoices[dataOverride.timeUnits].name}
              </div>
            </div>
          </div>

          <HoverMenu
            canWrite={this.props.workflow.workflowPermissions.write}
            canComment={this.props.workflow.workflowPermissions.viewComments}
            objectId={this.props.objectId}
            parentId={this.props.parentId}
            objectType={this.objectType}
          />

          {nodePorts}
          {nodeLinks}
          {autoLink}

          <div className="side-actions">
            <this.SideActions />
            <div className="comment-indicator-container"></div>
            <div className="assignment-indicator-container"></div>
          </div>
        </div>
      </>
    )
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  return {
    workflow: state.workflow,
    node: getNodeByID(state, ownProps.objectId)
  }
}

const Node = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(NodeUnconnected)

export default Node
