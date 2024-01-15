// @ts-nocheck
import * as React from 'react'
import { connect } from 'react-redux'
// @components
import { OutcomeTitle, ActionButton } from '@cfUIComponents'
import { Component } from '@cfParentComponents'
import { EditableComponentWithSorting } from '@cfParentComponents'
import OutcomeOutcome from './OutcomeOutcome'
import { getOutcomeByID, getOutcomeHorizontalLinkByID } from '@cfFindState'

import * as Utility from '@cfUtility'
import * as Constants from '@cfConstants'
import SimpleOutcome from './SimpleOutcome'
import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import ActionCreator from '@cfRedux/ActionCreator.ts'
import { updateOutcomehorizontallinkDegree } from '@XMLHTTP/API/outcome'
import { insertedAtInstant } from '@XMLHTTP/API/global'
import { CfObjectType } from '@cfModule/types/enum'
// import $ from 'jquery'

/**
 * The link to tagged outcomes. Used when an outcome
 * is tagged with other outcomes from a parent workflow
 */
class OutcomeHorizontalLinkUnconnected extends Component {
  constructor(props) {
    super(props)
    this.objectType = CfObjectType.OUTCOMEHORIZONTALLINK
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.checkHidden()
  }

  componentDidUpdate() {
    this.checkHidden()
  }

  componentWillUnmount() {
    this.checkHidden()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  deleteSelf(data) {
    const props = this.props
    //Temporary confirmation; add better confirmation dialogue later
    if (
      window.confirm(
        window.gettext('Are you sure you want to delete this ') +
          Constants.get_verbose(
            this.props.data,
            this.objectType
          ).toLowerCase() +
          '?'
      )
    ) {
      COURSEFLOW_APP.tinyLoader.startLoad()
      updateOutcomehorizontallinkDegree(
        data.outcome,
        data.parent_outcome,
        0,
        (response_data) => {
          COURSEFLOW_APP.tinyLoader.endLoad()
        }
      )
    }
  }

  /**
   * Adds a button that deletes the item (with a confirmation). The callback function is called after the object is removed from the DOM
   * @param data
   * @returns {JSX.Element}
   */
  addDeleteSelf(data) {
    const icon = 'close.svg'
    return (
      <ActionButton
        buttonIcon={icon}
        buttonClass="delete-self-button"
        titleText={window.gettext('Delete')}
        handleClick={this.deleteSelf.bind(this, data)}
      />
    )
  }

  /**
   * @todo what is this doing?
   */
  checkHidden() {
    if ($(this.mainDiv.current).children('.outcome').length == 0)
      $(this.mainDiv.current).css('display', 'none')
    else $(this.mainDiv.current).css('display', '')
    const indicator = $(this.mainDiv.current).closest('.outcome-node-indicator')
    if (indicator.length >= 0) {
      const num_outcomenodes = indicator
        .children('.outcome-node-container')
        .children('.outcome-node:not([style*="display: none"])').length
      indicator
        .children('.outcome-node-indicator-number')
        .html(num_outcomenodes)
      if (num_outcomenodes == 0) indicator.css('display', 'none')
      else indicator.css('display', '')
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    //It's possible we don't actually have this data, if the horizontal link is dead
    if (!data) return null
    return (
      <div
        className={'outcome-node outcome-' + data.id}
        id={data.id}
        ref={this.mainDiv}
      >
        {!this.props.renderer.read_only && (
          <div>{this.addDeleteSelf(data, 'close.svg')}</div>
        )}
        <SimpleOutcome
          renderer={this.props.renderer}
          checkHidden={this.checkHidden.bind(this)}
          objectID={data.parent_outcome}
          parentID={this.props.parentID}
          throughParentID={data.id}
        />
      </div>
    )
  }
}

const mapOutcomeHorizontalLinkStateToProps = (state, own_props) =>
  getOutcomeHorizontalLinkByID(state, own_props.objectID)

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const OutcomeHorizontalLink = connect(
  mapOutcomeHorizontalLinkStateToProps,
  null
)(OutcomeHorizontalLinkUnconnected)

/**
 * Basic component representing an outcome
 */
class OutcomeUnconnected extends EditableComponentWithSorting {
  constructor(props) {
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
    this.props.renderer.micro_update(
      ActionCreator.moveOutcomeOutcome(id, new_position, new_parent, child_id)
    )
    insertedAt(
      this.props.renderer,
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
        this.props.renderer,
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
    let dropIcon
    let droptext
    const style = {}

    if (Utility.checkSetHidden(data, this.props.object_sets)) return null
    if (data.is_dropped)
      children = data.child_outcome_links.map((outcomeoutcome) => (
        <OutcomeOutcome
          key={outcomeoutcome}
          objectID={outcomeoutcome}
          parentID={data.id}
          renderer={this.props.renderer}
          show_horizontal={this.props.show_horizontal}
          parent_depth={this.props.data.depth}
        />
      ))

    if (this.state.show_horizontal_links)
      outcomehorizontallinks = (
        <div
          className={'outcome-node-container'}
          onMouseLeave={() => {
            this.setState({ show_horizontal_links: false })
          }}
        >
          {data.outcome_horizontal_links_unique.map((horizontal_link) => (
            <OutcomeHorizontalLink
              key={horizontal_link}
              objectID={horizontal_link}
              renderer={this.props.renderer}
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
              this.setState({ show_horizontal_links: true })
            }}
          >
            {data.outcome_horizontal_links_unique.length}
          </div>
          {outcomehorizontallinks}
        </div>
      )
    }

    if (!this.props.renderer.read_only) {
      mouseover_actions.push(this.addInsertSibling(data))
      mouseover_actions.push(this.addDuplicateSelf(data))
      mouseover_actions.push(this.addDeleteSelf(data))
      if (data.depth < 2) mouseover_actions.push(this.addInsertChild(data))
    }
    if (this.props.renderer.view_comments) {
      // mouseover_actions.push(this.addCommenting(data))
      mouseover_actions.push(this.addCommenting())
    }

    if (data.is_dropped) {
      dropIcon = 'droptriangleup'
    } else {
      dropIcon = 'droptriangledown'
    }

    if (data.is_dropped) {
      droptext = window.gettext('hide')
    } else {
      droptext =
        window.gettext('show ') +
        data.child_outcome_links.length +
        ' ' +
        window.gettext(
          'descendant',
          'descendants',
          data.child_outcome_links.length
        )
    }

    if (
      !this.props.renderer.read_only &&
      data.depth < 2 &&
      data.child_outcome_links.length === 0 &&
      children
    )
      children.push(
        <div className="outcome-outcome" style={{ height: '5px' }} />
      )

    if (data.lock) {
      style.border = '2px solid ' + data.lock.user_colour
    }

    let css_class = 'outcome outcome-' + data.id
    if (data.is_dropped) css_class += ' dropped'
    if (data.lock) css_class += ' locked locked-' + data.lock.user_id

    return (
      <div
        style={style}
        className={css_class}
        ref={this.mainDiv}
        onClick={(evt) =>
          this.props.renderer.selection_manager.changeSelection(evt, this)
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
              <img src={COURSEFLOW_APP.config.icon_path + dropIcon + '.svg'} />
            </div>
            <div className="outcome-drop-text">{droptext}</div>
          </div>
        )}
        {data.depth < 2 && (
          <ol
            className={'children-block children-block-' + this.props.data.depth}
            id={this.props.objectID + '-children-block'}
            ref={this.children_block}
          >
            {children}
          </ol>
        )}
        {!this.props.renderer.read_only && data.depth < 2 && (
          <div
            className="outcome-create-child"
            onClick={this.insertChild.bind(this, data)}
          >
            {window.gettext('+ Add New')}
          </div>
        )}
        <div className="mouseover-actions">{mouseover_actions}</div>
        {this.addEditable(data)}

        <div className="side-actions">
          {side_actions}
          <div className="comment-indicator-container" />
        </div>
      </div>
    )
  }
}

const mapOutcomeStateToProps = (state, own_props) =>
  getOutcomeByID(state, own_props.objectID)

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const Outcome = connect(mapOutcomeStateToProps, null)(OutcomeUnconnected)

export default Outcome
