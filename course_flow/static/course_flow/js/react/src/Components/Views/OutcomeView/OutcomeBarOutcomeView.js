import * as React from 'react'
import { getOutcomeByID } from '../../../redux/FindState.js'
import { connect } from 'react-redux'
import { OutcomeTitle } from '../../components/CommonComponents/UIComponents'
import { Component } from '../../components/CommonComponents/Extended'
import * as Utility from '../../../UtilityFunctions.js'
import { OutcomeBarOutcomeOutcomeView } from '../OutcomeOutcomeView.js'

/**
 * Basic component representing an outcome in the outcome bar
 */
export class OutcomeBarOutcomeViewUnconnected extends Component {
  constructor(props) {
    super(props)
    this.objectType = 'outcome'
    this.children_block = React.createRef()
    this.state = { is_dropped: props.data.depth < 1 }
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
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

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
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

  /*******************************************************
   * RENDER
   *******************************************************/
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

    if (this.state.is_dropped) droptext = window.gettext('hide')
    else
      droptext =
        window.gettext('show ') +
        data.child_outcome_links.length +
        ' ' +
        nwindow.gettext('descendant', 'descendants', data.child_outcome_links.length)

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
              <img src={window.config.icon_path + dropIcon + '.svg'} />
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
}

/*******************************************************
 * MAP STATE TO PROPS
 *******************************************************/
const mapOutcomeBarOutcomeStateToProps = (state, own_props) => ({
  ...getOutcomeByID(state, own_props.objectID),
  nodes: state.outcomenode
    .filter((outcomenode) => outcomenode.outcome == own_props.objectID)
    .map((outcomenode) => outcomenode.node),
  horizontaloutcomes: state.outcomehorizontallink
    .filter((ochl) => ochl.parent_outcome == own_props.objectID)
    .map((ochl) => ochl.outcome)
})

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const OutcomeBarOutcomeView = connect(
  mapOutcomeBarOutcomeStateToProps,
  null
)(OutcomeBarOutcomeViewUnconnected)

export default OutcomeBarOutcomeView
