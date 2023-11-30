import * as React from 'react'
import { connect } from 'react-redux'
import {
  ActionButton,
  Component,
  EditableComponentWithSorting,
  EditableComponentWithComments,
  OutcomeTitle
} from '../components/CommonComponents'
import OutcomeOutcomeView from './OutcomeOutcomeView.js'
import {
  OutcomeBarOutcomeOutcomeView,
  SimpleOutcomeOutcomeView
} from './OutcomeOutcomeView.js'
import {
  getOutcomeByID,
  getOutcomeHorizontalLinkByID
} from '../../FindState.js'
import { moveOutcomeOutcome } from '../../Reducers.js'
import {
  updateOutcomenodeDegree,
  updateOutcomehorizontallinkDegree,
  insertedAt,
  insertedAtInstant
} from '../../PostFunctions.js'
import * as Constants from '../../Constants.js'
import * as Utility from '../../UtilityFunctions.js'
import * as OutcomeNode from '../components/OutcomeNode/outcomeNode.js'

//Basic component representing an outcome
class OutcomeView extends EditableComponentWithSorting {
  constructor(props) {
    super(props)
    this.objectType = 'outcome'
    if (props.data.depth === 0) this.objectType = 'outcome_base'
    this.children_block = React.createRef()
  }

  render() {
    let data = this.props.data
    let children
    let outcomehorizontallinks
    let side_actions = []
    let mouseover_actions = []
    let dropIcon
    let droptext
    let style = {}

    if (Utility.checkSetHidden(data, this.props.object_sets)) return null
    if (data.is_dropped)
      children = data.child_outcome_links.map((outcomeoutcome) => (
        <OutcomeOutcomeView
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
            <OutcomeHorizontalLinkView
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
    if (this.props.renderer.view_comments)
      mouseover_actions.push(this.addCommenting(data))

    if (data.is_dropped) dropIcon = 'droptriangleup'
    else dropIcon = 'droptriangledown'

    if (data.is_dropped) droptext = gettext('hide')
    else
      droptext =
        gettext('show ') +
        data.child_outcome_links.length +
        ' ' +
        ngettext('descendant', 'descendants', data.child_outcome_links.length)

    if (
      !this.props.renderer.read_only &&
      data.depth < 2 &&
      data.child_outcome_links.length == 0 &&
      children
    )
      children.push(
        <div className="outcome-outcome" style={{ height: '5px' }}></div>
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
        ref={this.maindiv}
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
              <img src={config.icon_path + dropIcon + '.svg'} />
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
            {gettext('+ Add New')}
          </div>
        )}
        <div className="mouseover-actions">{mouseover_actions}</div>
        {this.addEditable(data)}

        <div className="side-actions">
          {side_actions}
          <div className="comment-indicator-container"></div>
        </div>
      </div>
    )
  }

  componentDidMount() {
    if (this.props.show_horizontal) this.makeDragAndDrop()
    //        if(this.props.show_horizontal)this.updateIndicator();
  }

  componentDidUpdate() {
    if (this.props.show_horizontal) this.makeDragAndDrop()
    //        if(this.props.show_horizontal)this.updateIndicator();
  }

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
    if (this.props.data.depth == 0) this.makeDroppable()
  }

  sortableMovedFunction(id, new_position, type, new_parent, child_id) {
    this.props.renderer.micro_update(
      moveOutcomeOutcome(id, new_position, new_parent, child_id)
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
        gettext(
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
        this.props.renderer,
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
    var props = this.props
    $(this.maindiv.current).droppable({
      tolerance: 'pointer',
      droppable: '.outcome-ghost',
      over: (e, ui) => {
        var drop_item = $(e.target)
        var drag_item = ui.draggable
        var drag_helper = ui.helper
        var new_index = drop_item.prevAll().length
        var new_parent_id = parseInt(drop_item.parent().attr('id'))

        if (drag_item.hasClass('outcome')) {
          drag_helper.addClass('valid-drop')
          drop_item.addClass('outcome-drop-over')
          return
        } else {
          return
        }
      },
      out: (e, ui) => {
        var drag_item = ui.draggable
        var drag_helper = ui.helper
        var drop_item = $(e.target)
        if (drag_item.hasClass('outcome')) {
          drag_helper.removeClass('valid-drop')
          drop_item.removeClass('outcome-drop-over')
        }
      },
      drop: (e, ui) => {
        $('.outcome-drop-over').removeClass('outcome-drop-over')
        var drop_item = $(e.target)
        var drag_item = ui.draggable
        if (drag_item.hasClass('outcome')) {
          props.renderer.tiny_loader.startLoad()
          updateOutcomehorizontallinkDegree(
            props.objectID,
            drag_item[0].dataDraggable.outcome,
            1,
            (response_data) => {
              props.renderer.tiny_loader.endLoad()
            }
          )
        }
      }
    })
  }
}

const mapOutcomeStateToProps = (state, own_props) =>
  getOutcomeByID(state, own_props.objectID)
export default connect(mapOutcomeStateToProps, null)(OutcomeView)

//Basic component representing an outcome in the outcome bar
export class OutcomeBarOutcomeViewUnconnected extends Component {
  constructor(props) {
    super(props)
    this.objectType = 'outcome'
    this.children_block = React.createRef()
    this.state = { is_dropped: props.data.depth < 1 }
  }

  render() {
    let data = this.props.data
    let children
    let dropIcon
    let droptext

    if (Utility.checkSetHidden(data, this.props.object_sets)) return null
    if (this.state.is_dropped)
      children = data.child_outcome_links.map((outcomeoutcome) => (
        <OutcomeBarOutcomeOutcomeView
          key={outcomeoutcome}
          objectID={outcomeoutcome}
          parentID={data.id}
          renderer={this.props.renderer}
        />
      ))

    if (this.state.is_dropped) dropIcon = 'droptriangleup'
    else dropIcon = 'droptriangledown'

    if (this.state.is_dropped) droptext = gettext('hide')
    else
      droptext =
        gettext('show ') +
        data.child_outcome_links.length +
        ' ' +
        ngettext('descendant', 'descendants', data.child_outcome_links.length)

    return (
      <div
        className={
          'outcome' +
          ((this.state.is_dropped && ' dropped') || '') +
          ' outcome-' +
          data.id
        }
        ref={this.maindiv}
      >
        <div className="outcome-title">
          <OutcomeTitle
            data={this.props.data}
            prefix={this.props.prefix}
            hovertext={this.props.hovertext}
          />
        </div>
        <input
          className="outcome-toggle-checkbox"
          type="checkbox"
          title="Toggle highlighting"
          onChange={this.clickFunction.bind(this)}
        />
        {data.depth < 2 && data.child_outcome_links.length > 0 && (
          <div className="outcome-drop" onClick={this.toggleDrop.bind(this)}>
            <div className="outcome-drop-img">
              <img src={config.icon_path + dropIcon + '.svg'} />
            </div>
            <div className="outcome-drop-text">{droptext}</div>
          </div>
        )}
        {data.depth < 2 && (
          <div
            className="children-block"
            id={this.props.objectID + '-children-block'}
            ref={this.children_block}
          >
            {children}
          </div>
        )}
      </div>
    )
  }

  toggleDrop(evt) {
    evt.stopPropagation()
    this.setState({ is_dropped: !this.state.is_dropped })
  }

  makeDraggable() {
    if (this.props.renderer.read_only) return
    let draggable_selector = 'outcome'
    let draggable_type = 'outcome'
    $(this.maindiv.current).draggable({
      helper: (e, item) => {
        var helper = $(document.createElement('div'))
        helper.addClass('outcome-ghost')
        helper.appendTo(document.body)
        return helper
      },
      cursor: 'move',
      cursorAt: { top: 20, left: 100 },
      distance: 10,
      start: (e, ui) => {
        $('.workflow-canvas').addClass('dragging-' + draggable_type)
        $(draggable_selector).addClass('dragging')
      },
      stop: (e, ui) => {
        $('.workflow-canvas').removeClass('dragging-' + draggable_type)
        $(draggable_selector).removeClass('dragging')
      }
    })
  }

  clickFunction(evt) {
    if (evt.target.checked) {
      this.toggleCSS(true, 'toggle')
    } else {
      this.toggleCSS(false, 'toggle')
    }
  }

  toggleCSS(is_toggled, type) {
    if (is_toggled) {
      $('.outcome-' + this.props.data.id).addClass('outcome-' + type)
      if (this.props.nodes.length)
        $(this.props.nodes.map((node) => '.node#' + node).join(', ')).addClass(
          'outcome-' + type
        )
      if (this.props.horizontaloutcomes.length)
        $(
          this.props.horizontaloutcomes.map((oc) => '.outcome-' + oc).join(', ')
        ).addClass('outcome-' + type)
    } else {
      $('.outcome-' + this.props.data.id).removeClass('outcome-' + type)
      if (this.props.nodes.length)
        $(
          this.props.nodes.map((node) => '.node#' + node).join(', ')
        ).removeClass('outcome-' + type)
      if (this.props.horizontaloutcomes.length)
        $(
          this.props.horizontaloutcomes.map((oc) => '.outcome-' + oc).join(', ')
        ).removeClass('outcome-' + type)
    }
  }

  componentDidMount() {
    this.makeDraggable()
    $(this.maindiv.current)[0].dataDraggable = { outcome: this.props.data.id }
    $(this.maindiv.current).mouseenter((evt) => {
      this.toggleCSS(true, 'hover')
    })
    $(this.maindiv.current).mouseleave((evt) => {
      this.toggleCSS(false, 'hover')
    })
    $(this.children_block.current).mouseleave((evt) => {
      this.toggleCSS(true, 'hover')
    })
    $(this.children_block.current).mouseenter((evt) => {
      this.toggleCSS(false, 'hover')
    })
  }
}

const mapOutcomeBarOutcomeStateToProps = (state, own_props) => ({
  ...getOutcomeByID(state, own_props.objectID),
  nodes: state.outcomenode
    .filter((outcomenode) => outcomenode.outcome == own_props.objectID)
    .map((outcomenode) => outcomenode.node),
  horizontaloutcomes: state.outcomehorizontallink
    .filter((ochl) => ochl.parent_outcome == own_props.objectID)
    .map((ochl) => ochl.outcome)
})

export const OutcomeBarOutcomeView = connect(
  mapOutcomeBarOutcomeStateToProps,
  null
)(OutcomeBarOutcomeViewUnconnected)

//Basic component representing an outcome in a node, or somewhere else where it doesn't have to do anything
export class SimpleOutcomeViewUnconnected extends EditableComponentWithComments {
  constructor(props) {
    super(props)
    this.objectType = 'outcome'
    this.children_block = React.createRef()
    this.state = { is_dropped: false }
  }

  render() {
    let data = this.props.data
    let children
    let dropIcon
    let droptext
    let comments
    let edit
    let onClick

    if (Utility.checkSetHidden(data, this.props.object_sets)) return null
    if (this.state.is_dropped) {
      children = data.child_outcome_links.map((outcomeoutcome) =>
        this.getChildType(outcomeoutcome)
      )
    }

    if (this.state.is_dropped) dropIcon = 'droptriangleup'
    else dropIcon = 'droptriangledown'

    if (this.state.is_dropped) droptext = gettext('hide')
    else
      droptext =
        gettext('show ') +
        data.child_outcome_links.length +
        ' ' +
        ngettext('descendant', 'descendants', data.child_outcome_links.length)

    if (this.props.renderer.view_comments) comments = this.addCommenting()

    if (this.props.edit) edit = this.addEditable(data, true)
    onClick = (evt) =>
      this.props.renderer.selection_manager.changeSelection(evt, this)

    let css_class = 'outcome outcome-' + data.id
    if (this.state.is_dropped) css_class += ' dropped'
    if (data.lock) css_class += ' locked locked-' + data.lock.user_id

    return (
      <div
        className={css_class}
        style={this.get_border_style()}
        ref={this.maindiv}
        onClick={onClick}
      >
        <div className="outcome-title">
          <OutcomeTitle
            data={data}
            prefix={this.props.prefix}
            hovertext={this.props.hovertext}
          />
        </div>
        {data.depth < 2 && data.child_outcome_links.length > 0 && (
          <div className="outcome-drop" onClick={this.toggleDrop.bind(this)}>
            <div className="outcome-drop-img">
              <img src={config.icon_path + dropIcon + '.svg'} />
            </div>
            <div className="outcome-drop-text">{droptext}</div>
          </div>
        )}
        {data.depth < 2 && (
          <div
            className="children-block"
            id={this.props.objectID + '-children-block'}
            ref={this.children_block}
          >
            {children}
          </div>
        )}
        <div className="mouseover-actions">{comments}</div>
        <div className="side-actions">
          <div className="comment-indicator-container" />
        </div>
        {edit}
      </div>
    )
  }

  toggleDrop() {
    this.setState({ is_dropped: !this.state.is_dropped })
  }

  getChildType(outcomeoutcome) {
    let data = this.props.data
    return (
      <SimpleOutcomeOutcomeView
        key={outcomeoutcome}
        objectID={outcomeoutcome}
        parentID={data.id}
        renderer={this.props.renderer}
        comments={this.props.comments}
        edit={this.props.edit}
      />
    )
  }

  componentDidMount() {
    if (this.props.checkHidden) this.props.checkHidden()
  }

  componentDidUpdate() {
    if (this.props.checkHidden) this.props.checkHidden()
  }
}

export const SimpleOutcomeView = connect(
  mapOutcomeStateToProps,
  null
)(SimpleOutcomeViewUnconnected)

class TableOutcomeBaseUnconnected extends Component {
  render() {
    let outcome_tree = OutcomeNode.createOutcomeNodeBranch(
      this.props,
      this.props.objectID,
      this.props.nodecategory
    )
    //avoid further rerenders if possible
    let outcome_tree_json = JSON.stringify(outcome_tree)

    if (this.outcome_tree_json === outcome_tree_json) {
      outcome_tree = this.outcome_tree
    } else {
      this.outcome_tree = outcome_tree
      this.outcome_tree_json = outcome_tree_json
    }

    return this.getOutcomeView(outcome_tree)
  }

  getOutcomeView(outcome_tree) {
    if (this.props.type === 'outcome_table') {
      return (
        <TableOutcomeView
          outcomes_type={this.props.outcomes_type}
          objectID={this.outcome_tree.id}
          outcome_tree={this.outcome_tree}
          renderer={this.props.renderer}
        />
      )
    }
    return (
      <MatrixOutcomeView
        outcomes_type={this.props.outcomes_type}
        objectID={this.outcome_tree.id}
        outcome_tree={this.outcome_tree}
        renderer={this.props.renderer}
      />
    )
  }
}

export const TableOutcomeBase = connect((state, own_props) => {
  return {
    outcomes_type: state.workflow.outcomes_type,
    outcome: state.outcome,
    outcomenode: state.outcomenode,
    outcomeoutcome: state.outcomeoutcome
  }
}, null)(TableOutcomeBaseUnconnected)

class TableOutcomeViewUnconnected extends Component {
  constructor(props) {
    super(props)
    this.objectType = 'outcome'
  }

  render() {
    let data = this.props.data
    let is_dropped = this.getIsDropped()
    let dropIcon
    if (is_dropped) dropIcon = 'droptriangleup'
    else dropIcon = 'droptriangledown'

    let droptext
    if (is_dropped) droptext = gettext('hide')
    else
      droptext =
        gettext('show ') +
        data.child_outcome_links.length +
        ' ' +
        ngettext('descendant', 'descendants', data.child_outcome_links.length)

    let comments

    let style

    let outcome_head = (
      <div className="outcome-wrapper">
        <div
          className="outcome-head"
          ref={this.maindiv}
          style={{ paddingLeft: data.depth * 12 }}
        >
          <div className="outcome-title" style={style}>
            <OutcomeTitle
              data={this.props.data}
              prefix={this.props.prefix}
              hovertext={this.props.hovertext}
            />
          </div>
          {data.child_outcome_links.length > 0 && (
            <div className="outcome-drop" onClick={this.toggleDrop.bind(this)}>
              <div className="outcome-drop-img">
                <img src={config.icon_path + dropIcon + '.svg'} />
              </div>
              <div className="outcome-drop-text">{droptext}</div>
            </div>
          )}
          <div className="mouseover-actions">{comments}</div>
          <div className="side-actions">
            <div className="comment-indicator-container"></div>
          </div>
        </div>
      </div>
    )

    let outcome_row = this.props.outcome_tree.outcomenodes.map(
      (outcomenodegroup) => {
        let group_row = outcomenodegroup.map((outcomenode) => (
          <TableCell
            outcomes_type={this.props.outcomes_type}
            renderer={this.props.renderer}
            nodeID={outcomenode.node_id}
            degree={outcomenode.degree}
            outcomeID={this.props.outcome_tree.id}
          />
        ))
        group_row.unshift(
          <TableCell
            outcomes_type={this.props.outcomes_type}
            renderer={this.props.renderer}
            total={true}
            degree={outcomenodegroup.total}
          />
        )
        return (
          <div className="table-group">
            <div className="table-cell blank-cell"></div>
            {group_row}
          </div>
        )
      }
    )
    outcome_row.push(<div className="table-cell blank-cell"></div>)
    outcome_row.push(
      <TableCell
        outcomes_type={this.props.outcomes_type}
        renderer={this.props.renderer}
        total={true}
        grand_total={true}
        degree={this.props.outcome_tree.outcomenodes.total}
      />
    )
    let full_row = (
      <div className={'outcome-row depth-' + data.depth}>
        {outcome_head}
        <div className="outcome-cells">{outcome_row}</div>
      </div>
    )

    let child_rows
    if (is_dropped)
      child_rows = this.props.outcome_tree.children.map((child) =>
        this.getChildOutcomeView(child)
      )
    return [full_row, child_rows]
  }

  getIsDropped() {
    return this.props.data.is_dropped
  }

  getChildOutcomeView(child) {
    return (
      <TableOutcomeView
        outcomes_type={this.props.outcomes_type}
        objectID={child.id}
        outcome_tree={child}
        renderer={this.props.renderer}
      />
    )
  }
}

export const TableOutcomeView = connect(
  mapOutcomeStateToProps,
  null
)(TableOutcomeViewUnconnected)

class MatrixOutcomeViewUnconnected extends TableOutcomeViewUnconnected {
  toggleDrop() {
    this.setState({ is_dropped: !this.state.is_dropped })
  }

  getIsDropped() {
    return this.state.is_dropped
  }

  getChildOutcomeView(child) {
    return (
      <MatrixOutcomeView
        outcomes_type={this.props.outcomes_type}
        objectID={child.id}
        outcome_tree={child}
        renderer={this.props.renderer}
      />
    )
  }
}

export const MatrixOutcomeView = connect(
  mapOutcomeStateToProps,
  null
)(MatrixOutcomeViewUnconnected)

class TableCell extends React.Component {
  render() {
    let degree = this.props.degree
    let class_name = 'table-cell'
    let input

    if (this.props.total) class_name += ' total-cell'
    if (this.props.grand_total) class_name += ' grand-total-cell'

    let checked = false
    if (degree) checked = true

    if (!this.props.renderer.read_only && !this.props.total) {
      if (this.props.outcomes_type === 0) {
        input = (
          <input
            type="checkbox"
            onChange={this.toggleFunction.bind(this)}
            checked={checked}
          />
        )
      } else {
        input = (
          <select value={degree} onChange={this.changeFunction.bind(this)}>
            <option value={0}>{'-'}</option>
            <option value={1}>{'C'}</option>
            <option value={2}>{'I'}</option>
            <option value={4}>{'D'}</option>
            <option value={8}>{'A'}</option>
            <option value={6}>{'ID'}</option>
            <option value={10}>{'IA'}</option>
            <option value={12}>{'DA'}</option>
            <option value={14}>{'IDA'}</option>
          </select>
        )
      }
    }

    return (
      <div className={class_name} ref={this.maindiv}>
        {this.getContents(degree, !this.props.total)}
        {input}
      </div>
    )
  }

  toggleFunction() {
    let props = this.props
    let value
    if (props.degree) value = 0
    else value = 1
    props.renderer.tiny_loader.startLoad()
    updateOutcomenodeDegree(
      props.nodeID,
      props.outcomeID,
      value,
      (response_data) => {
        props.renderer.tiny_loader.endLoad()
      }
    )
  }

  changeFunction(evt) {
    let props = this.props
    let value = evt.target.value
    props.renderer.tiny_loader.startLoad()
    updateOutcomenodeDegree(
      props.nodeID,
      props.outcomeID,
      value,
      (response_data) => {
        props.renderer.tiny_loader.endLoad()
        $(':focus').blur()
      }
    )
  }

  getContents(completion_status, self_completion) {
    let contents = []
    let divclass = ''

    if (completion_status === 0) {
      return <img src={config.icon_path + 'nocheck.svg'} />
    } else if (!completion_status) {
      return ''
    }
    if (this.props.outcomes_type === 0 || completion_status & 1) {
      if (self_completion)
        return (
          <img
            className="self-completed"
            src={config.icon_path + 'solid_check.svg'}
          />
        )
      else return <img src={config.icon_path + 'check.svg'} />
    }

    if (completion_status & 2) {
      if (self_completion & 2) divclass = ' self-completed'
      contents.push(
        <div className={'outcome-introduced outcome-degree' + divclass}>I</div>
      )
    }
    if (completion_status & 4) {
      if (self_completion & 4) divclass = ' self-completed'
      contents.push(
        <div className={'outcome-developed outcome-degree' + divclass}>D</div>
      )
    }
    if (completion_status & 8) {
      if (self_completion & 8) divclass = ' self-completed'
      contents.push(
        <div className={'outcome-advanced outcome-degree' + divclass}>A</div>
      )
    }
    return contents
  }
}

/*
Horizontal OutcomeLinking
*/

//Basic component representing an outcome to parent outcome
class OutcomeHorizontalLinkViewUnconnected extends Component {
  constructor(props) {
    super(props)
    this.objectType = 'outcomehorizontallink'
  }

  render() {
    let data = this.props.data
    //It's possible we don't actually have this data, if the horizontal link is dead
    if (!data) return null
    return (
      <div
        className={'outcome-node outcome-' + data.id}
        id={data.id}
        ref={this.maindiv}
      >
        {!this.props.renderer.read_only && (
          <div>{this.addDeleteSelf(data, 'close.svg')}</div>
        )}
        <SimpleOutcomeView
          renderer={this.props.renderer}
          checkHidden={this.checkHidden.bind(this)}
          objectID={data.parent_outcome}
          parentID={this.props.parentID}
          throughParentID={data.id}
        />
      </div>
    )
  }

  deleteSelf(data) {
    let props = this.props
    //Temporary confirmation; add better confirmation dialogue later
    if (
      window.confirm(
        gettext('Are you sure you want to delete this ') +
          Constants.get_verbose(
            this.props.data,
            this.objectType
          ).toLowerCase() +
          '?'
      )
    ) {
      props.renderer.tiny_loader.startLoad()
      updateOutcomehorizontallinkDegree(
        data.outcome,
        data.parent_outcome,
        0,
        (response_data) => {
          props.renderer.tiny_loader.endLoad()
        }
      )
    }
  }

  //Adds a button that deletes the item (with a confirmation). The callback function is called after the object is removed from the DOM
  addDeleteSelf(data) {
    let icon = 'close.svg'
    return (
      <ActionButton
        button_icon={icon}
        button_class="delete-self-button"
        titletext={gettext('Delete')}
        handleClick={this.deleteSelf.bind(this, data)}
      />
    )
  }

  /**
   * @todo what is this doing?
   */
  checkHidden() {
    if ($(this.maindiv.current).children('.outcome').length == 0)
      $(this.maindiv.current).css('display', 'none')
    else $(this.maindiv.current).css('display', '')
    let indicator = $(this.maindiv.current).closest('.outcome-node-indicator')
    if (indicator.length >= 0) {
      let num_outcomenodes = indicator
        .children('.outcome-node-container')
        .children('.outcome-node:not([style*="display: none"])').length
      indicator
        .children('.outcome-node-indicator-number')
        .html(num_outcomenodes)
      if (num_outcomenodes == 0) indicator.css('display', 'none')
      else indicator.css('display', '')
    }
  }

  componentDidMount() {
    this.checkHidden()
  }

  componentDidUpdate() {
    this.checkHidden()
  }

  componentWillUnmount() {
    this.checkHidden()
  }
}

const mapOutcomeHorizontalLinkStateToProps = (state, own_props) =>
  getOutcomeHorizontalLinkByID(state, own_props.objectID)
export const OutcomeHorizontalLinkView = connect(
  mapOutcomeHorizontalLinkStateToProps,
  null
)(OutcomeHorizontalLinkViewUnconnected)
