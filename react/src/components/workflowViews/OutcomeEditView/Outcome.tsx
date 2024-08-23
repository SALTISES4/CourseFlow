import * as React from 'react'
import { connect } from 'react-redux'
// @components
import { OutcomeTitle } from '@cfCommonComponents/UIComponents/Titles'
import EditableComponentWithSorting from '@cfParentComponents/EditableComponentWithSorting'
import OutcomeOutcome from './OutcomeOutcome'
import { getOutcomeByID, TGetOutcomeByID } from '@cfFindState'

import * as Utility from '@cfUtility'
import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import ActionCreator from '@cfRedux/ActionCreator'
import { updateOutcomehorizontallinkDegree } from '@XMLHTTP/API/update'
import { insertedAtInstant } from '@XMLHTTP/API/update'
import { CfObjectType } from '@cfModule/types/enum'
import { AppState } from '@cfRedux/types/type'
import {
  EditableComponentWithSortingProps,
  EditableComponentWithSortingState
} from '@cfParentComponents/EditableComponentWithSorting'
import OutcomeHorizontalLink from '@cfViews/OutcomeEditView/OutcomeHorizontalLink'
// import $ from 'jquery'

type ConnectedProps = TGetOutcomeByID
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
      this.props.objectID,
      'outcomeoutcome',
      '.outcome-outcome-' + this.props.data.depth,
      false,
      false,
      '#workflow-' + this.props.workflow_id,
      '.outcome'
    )
    if (this.props.data.depth === 0) this.makeDroppable()
  }

  sortableMovedFunction(id, new_position, type, new_parent, child_id) {
    this.context.micro_update(
      ActionCreator.moveOutcomeOutcome(id, new_position, new_parent, child_id)
    )
    insertedAt(
      this.context.selection_manager,
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
        window.gettext(
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
            props.objectID,
            // @ts-ignore
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

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let children
    let outcomehorizontallinks
    const side_actions = []
    const mouseover_actions = []

    if (Utility.checkSetHidden(data, this.props.object_sets)) return null
    //Child outcomes. See comment in models/outcome.py for more info.
    if (data.is_dropped)
      children = data.child_outcome_links.map((outcomeoutcome) => (
        <OutcomeOutcome
          key={outcomeoutcome}
          objectID={outcomeoutcome}
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
          {data.outcome_horizontal_links_unique.map((horizontal_link) => (
            <OutcomeHorizontalLink
              key={horizontal_link}
              objectID={horizontal_link}
              // renderer={this.context}
            />
          ))}
        </div>
      )

    if (
      this.props.show_horizontal &&
      data.outcome_horizontal_links_unique.length > 0
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
            {data.outcome_horizontal_links_unique.length}
          </div>
          {outcomehorizontallinks}
        </div>
      )
    }

    if (!this.context.read_only) {
      mouseover_actions.push(<this.AddInsertSibling data={data} />)
      mouseover_actions.push(<this.AddDuplicateSelf data={data} />)
      mouseover_actions.push(<this.AddDeleteSelf data={data} />)
      if (data.depth < 2) {
        mouseover_actions.push(<this.AddInsertChild data={data} />)
      }
    }
    if (this.context.view_comments) {
      // mouseover_actions.push(this.addCommenting(data))
      mouseover_actions.push(<this.AddCommenting />)
    }

    const dropIcon = data.is_dropped ? 'droptriangleup' : 'droptriangledown'

    const droptext = data.is_dropped
      ? window.gettext('hide')
      : window.gettext('show ') +
        data.child_outcome_links.length +
        ' ' +
        window.ngettext(
          'descendant',
          'descendants',
          data.child_outcome_links.length
        )

    if (
      !this.context.read_only &&
      data.depth < 2 &&
      data.child_outcome_links.length === 0 &&
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
      style.border = '2px solid ' + data.lock.user_colour
    }

    const cssClass = [
      'outcome outcome-' + data.id,
      data.is_dropped ? ' dropped' : '',
      data.lock ? 'locked locked-' + data.lock.user_id : ''
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
            this.context.selection_manager.changeSelection(evt, this)
          }
        >
          <div className="outcome-title">
            <OutcomeTitle
              data={this.props.data}
              prefix={this.props.prefix}
              hovertext={this.props.hovertext}
            />
          </div>

          {data.depth < 2 && data.child_outcome_links.length > 0 && (
            <div className="outcome-drop" onClick={this.toggleDrop.bind(this)}>
              <div className="outcome-drop-img">
                <img
                  src={
                    COURSEFLOW_APP.globalContextData.path.static_assets.icon + dropIcon + '.svg'
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
              id={this.props.objectID + '-children-block'}
              ref={this.children_block}
            >
              {children}
            </ol>
          )}

          {!this.context.read_only && data.depth < 2 && (
            <div
              className="outcome-create-child"
              onClick={this.insertChild.bind(this, data)}
            >
              {window.gettext('+ Add New')}
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
): TGetOutcomeByID => {
  return getOutcomeByID(state, ownProps.objectID)
}

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const Outcome = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(OutcomeUnconnected)

export default Outcome
