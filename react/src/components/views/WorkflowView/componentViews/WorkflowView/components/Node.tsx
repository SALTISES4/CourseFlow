import * as React from 'react'
import * as reactDom from 'react-dom'
import { connect } from 'react-redux'
import * as Utility from '@cfUtility'
import * as Constants from '@cfConstants'
import { getNodeByID, TGetNodeByID } from '@cfFindState'

import { NodeTitle, TitleText } from '@cfComponents/UIPrimitives/Titles'
import EditableComponentWithActions from '@cfEditableComponents/EditableComponentWithActions'
import NodeLink from './NodeLink'
import { AppState } from '@cfRedux/types/type'
import {
  EditableComponentWithActionsProps,
  EditableComponentWithActionsState
} from '@cfEditableComponents/EditableComponentWithActions'
import { updateOutcomenodeDegree } from '@XMLHTTP/API/update'
import { CfObjectType } from '@cf/types/enum'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import NodePorts from '@cfViews/components/Node/NodePorts'
import AutoLink from './AutoLink'
import OutcomeNode from '@cfViews/components/OutcomeNode'
import { _t } from '@cf/utility/utilityFunctions'
// import $ from 'jquery'

type ConnectedProps = TGetNodeByID
type OwnProps = {
  objectId: number
  column_order: any
} & EditableComponentWithActionsProps
type StateProps = {
  initial_render: boolean
  show_outcomes: boolean
  hovered: boolean
} & EditableComponentWithActionsState
type PropsType = ConnectedProps & OwnProps

/**
 * Represents the node in the workflow view
 */
class NodeUnconnected extends EditableComponentWithActions<
  PropsType,
  StateProps
> {
  static contextType = WorkFlowConfigContext
  declare context: React.ContextType<typeof WorkFlowConfigContext>

  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.NODE
    this.state = {
      initial_render: true,
      show_outcomes: false
    } as StateProps
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    if (this.state.initial_render) {
      this.setState({
        initial_render: false
      })
    }

    this.makeDroppable()
    this.updateHidden()

    // $(this.mainDiv.current).on('mouseenter', this.mouseIn.bind(this))
    // $(this.mainDiv.current).on('dblclick', this.doubleClick.bind(this))
    this.mainDiv.current.addEventListener('mouseenter', this.mouseIn.bind(this))
    this.mainDiv.current.addEventListener(
      'dblclick',
      this.doubleClick.bind(this)
    )
  }

  componentWillUnmount() {
    this.mainDiv.current.removeEventListener(
      'mouseenter',
      this.mouseIn.bind(this)
    )
    this.mainDiv.current.removeEventListener(
      'dblclick',
      this.doubleClick.bind(this)
    )
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.data.is_dropped == prevProps.data.is_dropped) {
      this.updatePorts()
    } else {
      Utility.triggerHandlerEach($('.node'), 'component-updated')
    }
    this.updateHidden()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  //Checks to see if we should mark this as empty. We don't want to do this if it's the only node in the week.
  updateHidden() {
    if ($(this.mainDiv.current).css('display') == 'none') {
      const week = $(this.mainDiv.current).parent('.node-week').parent()
      if (week.children('.node-week:not(.empty)').length > 1)
        $(this.mainDiv.current).parent('.node-week').addClass('empty')
    } else $(this.mainDiv.current).parent('.nodeweek').removeClass('empty')
  }

  updatePorts() {
    $(this.mainDiv.current).triggerHandler('component-updated')
  }

  doubleClick(evt) {
    evt.stopPropagation()
    if (this.props.data.linked_workflow) {
      window.open(this.props.data.linked_workflow_data.url)
    }
  }

  makeDroppable() {
    // @ts-ignore
    $(this.mainDiv.current).droppable({
      tolerance: 'pointer',
      // @ts-ignore // droppable does not exist in type DroppableOptions
      droppable: '.outcome-ghost',
      over: (e, ui) => {
        const drop_item = $(e.target)
        const drag_item = ui.draggable
        const drag_helper = ui.helper
        const new_index = drop_item.prevAll().length
        const new_parent_id = parseInt(drop_item.parent().attr('id'))

        if (drag_item.hasClass('outcome')) {
          drag_helper.addClass('valid-drop')
          drop_item.addClass('outcome-drop-over')
          return
        } else {
          return
        }
      },
      out: (e, ui) => {
        const drag_item = ui.draggable
        const drag_helper = ui.helper
        const drop_item = $(e.target)
        if (drag_item.hasClass('outcome')) {
          drag_helper.removeClass('valid-drop')
          drop_item.removeClass('outcome-drop-over')
        }
      },
      drop: (e, ui) => {
        $('.outcome-drop-over').removeClass('outcome-drop-over')
        const drag_item = ui.draggable
        if (drag_item.hasClass('outcome')) {
          COURSEFLOW_APP.tinyLoader.startLoad()
          updateOutcomenodeDegree(
            this.props.objectId,
            // @ts-ignore // data draggable is custom
            drag_item[0].dataDraggable.outcome,
            1,
            (response_data) => {
              COURSEFLOW_APP.tinyLoader.endLoad()
            }
          )
        }
      }
    })
  }

  mouseIn(_evt) {
    const myComponent = this

    if ($('.workflow-canvas').hasClass('creating-node-link')) return
    if (!this.context.permissions.workflowPermission.readOnly)
      $(
        "circle[data-node-id='" +
          this.props.objectId +
          "'][data-port-type='source']"
      ).addClass('mouseover')
    // @ts-ignore // not sure whether to import d3 directly yet
    d3.selectAll('.node-ports').raise()
    this.setState({
      hovered: true
    })

    $(document).on('mousemove', function (evt) {
      if (
        !myComponent ||
        !myComponent.mainDiv ||
        Utility.mouseOutsidePadding(evt, $(myComponent.mainDiv.current), 20)
      ) {
        $(
          "circle[data-node-id='" +
            myComponent.props.objectId +
            "'][data-port-type='source']"
        ).removeClass('mouseover')
        $(document).off(evt)
        myComponent.setState({
          hovered: false
        })
      }
    })
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data_override
    let nodePorts
    let node_links
    let auto_link
    let outcomenodes
    let lefticon
    let righticon
    let dropIcon
    let linkIcon
    const mouseover_actions = []

    const data = this.props.data
    const selection_manager = this.context.selectionManager

    if (data.represents_workflow) {
      data_override = { ...data, ...data.linked_workflow_data, id: data.id }
    } else {
      data_override = { ...data }
    }

    if (!this.state.initial_render) {
      // this is dynamic see: react/src/components/views/WorkflowView/WorkflowView.tsx
      nodePorts = reactDom.createPortal(
        <NodePorts
          // renderer={renderer}
          nodeID={this.props.objectId}
          node_div={this.mainDiv}
          dispatch={this.props.dispatch}
        />,
        $('.workflow-canvas')[0]
      )
      node_links = data.outgoing_links.map((link) => (
        <NodeLink key={link} objectId={link} node_div={this.mainDiv} />
      ))
      if (data.has_autolink)
        auto_link = (
          <AutoLink nodeID={this.props.objectId} node_div={this.mainDiv} />
        )
    }

    if (this.state.show_outcomes)
      outcomenodes = (
        <div
          className={'outcome-node-container column-' + data.column}
          onMouseLeave={() => {
            this.setState({ show_outcomes: false })
          }}
          style={{ borderColor: Constants.getColumnColour(this.props.column) }}
        >
          {data.outcomenode_unique_set.map((outcomenode) => (
            <OutcomeNode key={outcomenode} objectId={outcomenode} />
          ))}
        </div>
      )

    const side_actions = []
    if (data.outcomenode_unique_set.length > 0) {
      side_actions.push(
        <div className="outcome-node-indicator">
          <div
            className={'outcome-node-indicator-number column-' + data.column}
            onMouseEnter={() => {
              this.setState({ show_outcomes: true })
            }}
            style={{
              borderColor: Constants.getColumnColour(this.props.column)
            }}
          >
            {data.outcomenode_unique_set.length}
          </div>
          {outcomenodes}
        </div>
      )
    }

    if (data.context_classification > 0)
      lefticon = (
        <div className="node-icon">
          <img
            title={
              this.context.workflow.choices.context_choices.find(
                (obj) => obj.type == data.context_classification
              ).name
            }
            src={
              COURSEFLOW_APP.globalContextData.path.static_assets.icon +
              Constants.context_keys[data.context_classification] +
              '.svg'
            }
          />
        </div>
      )
    if (data.task_classification > 0) {
      righticon = (
        <div className="node-icon">
          <img
            title={
              this.context.workflow.choices.task_choices.find(
                (obj) => obj.type == data.task_classification
              ).name
            }
            src={
              COURSEFLOW_APP.globalContextData.path.static_assets.icon +
              Constants.task_keys[data.task_classification] +
              '.svg'
            }
          />
        </div>
      )
    }

    if (data.is_dropped) {
      dropIcon = 'droptriangleup'
    } else {
      dropIcon = 'droptriangledown'
    }

    let linktext = _t('Visit workflow')
    let link_class = 'linked-workflow'

    let clickfunc = this.doubleClick.bind(this)

    if (data.linked_workflow_data) {
      if (
        data.linked_workflow_data.url == 'noaccess' ||
        data.linked_workflow_data.url == 'nouser'
      ) {
        linktext = _t('<Inaccessible>')
        clickfunc = null
        link_class += ' link-noaccess'
      } else if (data.linked_workflow_data.deleted) {
        linktext = _t('<Deleted>')
        clickfunc = null
        link_class += ' link-noaccess'
      } else {
        link_class += ' hover-shade'
      }
    }

    if (data.linked_workflow)
      linkIcon = (
        <div className={link_class} onClick={clickfunc}>
          <img
            src={
              COURSEFLOW_APP.globalContextData.path.static_assets.icon +
              'wflink.svg'
            }
          />
          <div>{linktext}</div>
        </div>
      )
    let dropText = ''
    if (
      data_override.description &&
      data_override.description.replace(
        /(<p\>|<\/p>|<br>|\n| |[^a-zA-Z0-9])/g,
        ''
      ) != ''
    )
      dropText = '...'
    const titleText = <NodeTitle data={data} />

    const style: React.CSSProperties = {
      left:
        Constants.columnwidth * this.props.column_order.indexOf(data.column) +
        'px',
      backgroundColor: Constants.getColumnColour(this.props.column)
    }

    if (data.lock) {
      style.outline = '2px solid ' + data.lock.user_colour
    }

    if (Utility.checkSetHidden(data, this.props.object_sets)) {
      style.display = 'none'
    }

    const cssClass = [
      'node column-' + data.column + ' ' + Constants.node_keys[data.node_type],
      data.is_dropped ? 'dropped' : '',
      data.lock ? 'locked locked-' + data.lock.user_id : ''
    ].join(' ')

    if (!this.context.permissions.workflowPermission.readOnly) {
      mouseover_actions.push(<this.AddInsertSibling data={data} />)
      mouseover_actions.push(<this.AddDuplicateSelf data={data} />)
      mouseover_actions.push(<this.AddDeleteSelf data={data} />)
    }

    if (this.context.workflow.view_comments) {
      mouseover_actions.push(<this.AddCommenting />)
    }

    return (
      <>
        {this.addEditable(data_override)}
        <div
          style={style}
          className={cssClass}
          id={data.id}
          ref={this.mainDiv}
          data-selected={this.state.selected}
          data-hovered={this.state.hovered}
          onClick={(evt) =>
            this.context.selectionManager.changeSelection(evt, this)
          }
        >
          <div className="node-top-row">
            {lefticon}
            {titleText}
            {righticon}
          </div>
          {linkIcon}
          <div className="node-details">
            <TitleText
              text={data_override.description}
              defaultText={_t('Click to edit')}
            />
          </div>
          <div
            className="node-drop-row hover-shade"
            onClick={this.toggleDrop.bind(this)}
          >
            <div className="node-drop-side node-drop-left">{dropText}</div>
            <div className="node-drop-middle">
              <img
                src={
                  COURSEFLOW_APP.globalContextData.path.static_assets.icon +
                  dropIcon +
                  '.svg'
                }
              />
            </div>
            <div className="node-drop-side node-drop-right">
              <div className="node-drop-time">
                {data_override.time_required &&
                  data_override.time_required +
                    ' ' +
                    this.context.workflow.choices.time_choices[
                      data_override.time_units
                    ].name}
              </div>
            </div>
          </div>
          <div className="mouseover-actions">{mouseover_actions}</div>
          {nodePorts}
          {node_links}
          {auto_link}
          <div className="side-actions">
            {side_actions}
            <div className="comment-indicator-container"></div>
            <div className="assignment-indicator-container"></div>
          </div>
        </div>
      </>
    )
  }
}

const mapStateToProps = (state: AppState, ownProps: OwnProps): TGetNodeByID => {
  return getNodeByID(state, ownProps.objectId)
}

const Node = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(NodeUnconnected)

export default Node
