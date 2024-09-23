import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import { OutcomeTitle } from '@cfComponents/UIPrimitives/Titles'
import EditableComponentWithSorting from '@cfEditableComponents/EditableComponentWithSorting'
import {
  EditableComponentWithSortingProps,
  EditableComponentWithSortingState
} from '@cfEditableComponents/EditableComponentWithSorting'
import { TGetOutcomeByID, getOutcomeByID } from '@cfFindState'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import OutcomeHorizontalLink from '@cfViews/WorkflowView/componentViews/OutcomeEditView/OutcomeHorizontalLink'
import { updateOutcomehorizontallinkDegree } from '@XMLHTTP/API/update'
import { insertedAtInstant } from '@XMLHTTP/API/update'
import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import * as React from 'react'
import { connect } from 'react-redux'
// @components

import OutcomeOutcome from './OutcomeOutcome'

// import $ from 'jquery'

type ConnectedProps = {
  outcome: TGetOutcomeByID
  workflow: TWorkflow
}
type OwnProps = {
  throughParentID?: number
  show_horizontal?: boolean
} & EditableComponentWithSortingProps
type StateProps = {
  show_horizontal_links: boolean
} & EditableComponentWithSortingState
type PropsType = ConnectedProps & OwnProps

/**
 * Basic component representing an outcome
 */
class OutcomeUnconnected extends EditableComponentWithSorting<
  PropsType,
  StateProps
> {
  private children_block: React.RefObject<HTMLOListElement>
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.OUTCOME

    // @todo i'm sure this check does something, but it's obscure, to verify
    // if (props.data.depth === 0)
    // {
    //   this.objectType = this.objectType.OUTCOME
    // }
    this.children_block = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    if (this.props.show_horizontal) this.makeDragAndDrop()
  }

  componentDidUpdate() {
    if (this.props.show_horizontal) this.makeDragAndDrop()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  makeDragAndDrop() {
    this.makeSortableNode(
      $(this.children_block.current)
        .children('.outcome-outcome')
        .not('ui-draggable'),
      this.props.objectId,
      'outcomeoutcome',
      '.outcome-outcome-' + this.props.data.depth,
      false,
      false,
      '#workflow-' + this.props.workflow.id,
      '.outcome'
    )
    if (this.props.data.depth === 0) this.makeDroppable()
  }

  sortableMovedFunction(id, new_position, type, new_parent, child_id) {
    this.context.editableMethods.microUpdate(
      ActionCreator.moveOutcomeOutcome(id, new_position, new_parent, child_id)
    )
    insertedAt(
      this.context.selectionManager,
      child_id,
      'outcome',
      new_parent,
      'outcome',
      new_position,
      'outcomeoutcome'
    )
  }

  stopSortFunction() {}

  sortableMovedOutFunction(id, new_position, type, new_parent, child_id) {
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
        'outcome',
        new_parent,
        'outcome',
        new_position,
        'outcomeoutcome'
      )
      insertedAtInstant(
        child_id,
        'outcome',
        new_parent,
        'outcome',
        new_position,
        'outcomeoutcome'
      )
    }
  }

  makeDroppable() {
    const props = this.props
    $(this.mainDiv.current).droppable({
      tolerance: 'pointer',
      // @ts-ignore // @todo
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
        const drop_item = $(e.target)
        const drag_item = ui.draggable
        if (drag_item.hasClass('outcome')) {
          COURSEFLOW_APP.tinyLoader.startLoad()
          updateOutcomehorizontallinkDegree(
            props.objectId,
            // @ts-ignore
            drag_item[0].dataDraggable.outcome,
            1,
            (responseData) => {
              COURSEFLOW_APP.tinyLoader.endLoad()
            }
          )
        }
      }
    })
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let children
    let outcomehorizontallinks
    const side_actions = []
    const mouseover_actions = []

    if (Utility.checkSetHidden(data, this.props.objectSets)) return null
    //Child outcomes. See comment in models/outcome.py for more info.
    if (data.isDropped)
      children = data.childOutcomeLinks.map((outcomeoutcome) => (
        <OutcomeOutcome
          key={outcomeoutcome}
          objectId={outcomeoutcome}
          parentID={data.id}
          // renderer={this.context}
          show_horizontal={this.props.show_horizontal}
          parent_depth={this.props.data.depth}
        />
      ))

    if (this.state.show_horizontal_links)
      outcomehorizontallinks = (
        <div
          className={'outcome-node-container'}
          onMouseLeave={() => {
            this.setState({
              show_horizontal_links: false
            })
          }}
        >
          {data.outcomeHorizontalLinksUnique.map((horizontal_link) => (
            <OutcomeHorizontalLink
              key={horizontal_link}
              objectId={horizontal_link}
              // renderer={this.context}
            />
          ))}
        </div>
      )

    if (
      this.props.show_horizontal &&
      data.outcomeHorizontalLinksUnique.length > 0
    ) {
      side_actions.push(
        <div className="outcome-node-indicator">
          <div
            className={'outcome-node-indicator-number'}
            onMouseEnter={() => {
              this.setState({
                show_horizontal_links: true
              })
            }}
          >
            {data.outcomeHorizontalLinksUnique.length}
          </div>
          {outcomehorizontallinks}
        </div>
      )
    }

    if (this.props.workflow.workflowPermission.write) {
      mouseover_actions.push(<this.AddInsertSibling data={data} />)
      mouseover_actions.push(<this.AddDuplicateSelf data={data} />)
      mouseover_actions.push(<this.AddDeleteSelf data={data} />)
      if (data.depth < 2) {
        mouseover_actions.push(<this.AddInsertChild data={data} />)
      }
    }
    if (this.props.workflow.workflowPermission.viewComments) {
      mouseover_actions.push(<this.AddCommenting />)
    }

    const dropIcon = data.isDropped ? 'droptriangleup' : 'droptriangledown'

    const droptext = data.isDropped
      ? _t('hide')
      : _t('show ') +
        data.childOutcomeLinks.length +
        ' ' +
        window.ngettext(
          'descendant',
          'descendants',
          data.childOutcomeLinks.length
        )

    if (
      this.props.workflow.workflowPermission.write &&
      data.depth < 2 &&
      data.childOutcomeLinks.length === 0 &&
      children
    ) {
      children.push(
        <div
          className="outcome-outcome"
          style={{
            height: '5px'
          }}
        />
      )
    }

    const style: React.CSSProperties = {}
    if (data.lock) {
      style.border = '2px solid ' + data.lock.userColour
    }

    const cssClass = [
      'outcome outcome-' + data.id,
      data.isDropped ? ' dropped' : '',
      data.lock ? 'locked locked-' + data.lock.userId : ''
    ].join(' ')

    return (
      <>
        {
          // Portal
          this.addEditable(data)
        }
        <div
          style={style}
          className={cssClass}
          ref={this.mainDiv}
          onClick={(evt) =>
            this.context.selectionManager.changeSelection(evt, this)
          }
        >
          <div className="outcome-title">
            <OutcomeTitle
              data={this.props.data}
              prefix={this.props.outcome.prefix}
              hovertext={this.props.outcome.hovertext}
            />
          </div>

          {data.depth < 2 && data.childOutcomeLinks.length > 0 && (
            <div className="outcome-drop" onClick={this.toggleDrop.bind(this)}>
              <div className="outcome-drop-img">
                <img
                  src={
                    COURSEFLOW_APP.globalContextData.path.static_assets.icon +
                    dropIcon +
                    '.svg'
                  }
                />
              </div>
              <div className="outcome-drop-text">{droptext}</div>
            </div>
          )}

          {data.depth < 2 && (
            <ol
              className={
                'children-block children-block-' + this.props.data.depth
              }
              id={this.props.objectId + '-children-block'}
              ref={this.children_block}
            >
              {children}
            </ol>
          )}

          {this.props.workflow.workflowPermission.write && data.depth < 2 && (
            <div
              className="outcome-create-child"
              onClick={this.insertChild.bind(this, data)}
            >
              {_t('+ Add New')}
            </div>
          )}

          <div className="mouseover-actions">{mouseover_actions}</div>

          <div className="side-actions">
            {side_actions}
            <div className="comment-indicator-container" />
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
    outcome: getOutcomeByID(state, ownProps.objectId),
    workflow: state.workflow
  }
}

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const Outcome = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(OutcomeUnconnected)

export default Outcome
