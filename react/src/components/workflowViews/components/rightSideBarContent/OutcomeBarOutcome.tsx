import * as React from 'react'
import {
  getOutcomeByID,
  TGetOutcomeByID,
  getOutcomeOutcomeByID,
  TOutcomeOutcomeByID
} from '@cfFindState'
import { connect } from 'react-redux'
import { OutcomeTitle } from '@cfCommonComponents/UIComponents/Titles'
import * as Utility from '@cfUtility'
import ComponentWithToggleDrop from '@cfEditableComponents/ComponentWithToggleDrop'

import { AppState } from '@cfRedux/types/type'
import { ChangeEvent } from 'react'
import { CfObjectType } from '@cfModule/types/enum'
// import $ from 'jquery'

/**
 * Used in the outcome bar
 */
/**
 * @TODO THESE COMPONENTS ARE CALLING EACH OTHER.....
 * probably OutcomeBarOutcomeOutcomeUnconnected should not be a separate component
 */

type OutcomeBarOutcomeOutcomeOwnProps = {
  objectID: number
  parentID: number
  readOnly: boolean
}
type OutcomeBarOutcomeOutcomeConnectedProps = TOutcomeOutcomeByID
type OutcomeBarOutcomeOutcomePropsType = OutcomeBarOutcomeOutcomeOwnProps &
  OutcomeBarOutcomeOutcomeConnectedProps

class OutcomeBarOutcomeOutcomeUnconnected extends React.Component<OutcomeBarOutcomeOutcomePropsType> {
  private objectType: CfObjectType
  constructor(props: OutcomeBarOutcomeOutcomePropsType) {
    super(props)
    this.objectType = CfObjectType.OUTCOMEOUTCOME // @todo check addEditable
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    // check on props.data since this is connected props, and state finder function can return undefined
    if (!this.props.data) {
      return <></>
    }

    //Child outcomes. See comment in models/outcome.py for more info.
    return (
      // <div className="outcome-outcome" id={data.id} ref={this.mainDiv}> @todo this.mainDiv is not used
      <div className="outcome-outcome" id={String(this.props.data.id)}>
        <OutcomeBarOutcome
          objectID={this.props.data.child}
          parentID={this.props.parentID}
          throughParentID={this.props.data.id}
          readOnly={this.props.readOnly}
          //renderer={this.props.renderer}
        />
      </div>
    )
  }
}

const mapOutcomeOutcomeStateToProps = (
  state: AppState,
  ownProps: OutcomeBarOutcomeOutcomeOwnProps
): OutcomeBarOutcomeOutcomeConnectedProps => {
  return getOutcomeOutcomeByID(state, ownProps.objectID)
}

const OutcomeBarOutcomeOutcome = connect<
  OutcomeBarOutcomeOutcomeConnectedProps,
  object,
  OutcomeBarOutcomeOutcomeOwnProps,
  AppState
>(
  mapOutcomeOutcomeStateToProps,
  null
)(OutcomeBarOutcomeOutcomeUnconnected)

/*******************************************************
 *  Basic component representing an
 *  outcome in the outcome bar
 *
 *******************************************************/

type OwnProps = {
  objectID: number
  parentID?: number
  readOnly: boolean
  throughParentID?: number
}
export type OutcomeBarOutcomePropsType = OwnProps

type ConnectedProps = TGetOutcomeByID & {
  nodes: number[]
  horizontaloutcomes: number[]
}
type PropsType = OwnProps & ConnectedProps

type StateType = {
  is_dropped: boolean
}

export class OutcomeBarOutcomeUnconnected<
  P extends PropsType
> extends ComponentWithToggleDrop<P, StateType> {
  protected children_block: React.RefObject<HTMLDivElement>
  // private objectType: string

  constructor(props: P) {
    super(props)
    this.objectType = CfObjectType.OUTCOME // @todo check addEditable
    this.children_block = React.createRef()
    this.state = { is_dropped: props.data.depth < 1 }
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeDraggable()
    // @todo - dataDraggable is not a property of a div element, what is happening here?
    // are we trying to store a 'data' attribute ont this div ref?
    // @ts-ignore
    $(this.mainDiv.current)[0].dataDraggable = { outcome: this.props.data.id }
    $(this.mainDiv.current).mouseenter((evt) => {
      this.toggleCSS(true, 'hover')
    })
    $(this.mainDiv.current).mouseleave((evt) => {
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
  toggleDrop = (evt: React.MouseEvent) => {
    evt.stopPropagation()
    this.setState({ is_dropped: !this.state.is_dropped })
  }

  makeDraggable() {
    if (this.props.readOnly) return
    const draggable_selector = 'outcome'
    const draggable_type = 'outcome'

    $(this.mainDiv?.current).draggable({
      helper: (_e, _item) => {
        const helper = $(document.createElement('div'))
        helper.addClass('outcome-ghost')
        helper.appendTo(document.body)
        return helper
      },
      cursor: 'move',
      cursorAt: { top: 20, left: 100 },
      distance: 10,
      start: (_e, _ui) => {
        $('.workflow-canvas').addClass('dragging-' + draggable_type)
        $(draggable_selector).addClass('dragging')
      },
      stop: (_e, _ui) => {
        $('.workflow-canvas').removeClass('dragging-' + draggable_type)
        $(draggable_selector).removeClass('dragging')
      }
    })
  }

  clickFunction(evt: ChangeEvent<HTMLInputElement>) {
    if (evt.target.checked) {
      this.toggleCSS(true, 'toggle')
    } else {
      this.toggleCSS(false, 'toggle')
    }
  }

  toggleCSS(is_toggled: boolean, type: string) {
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
    const data = this.props.data
    let children
    let dropIcon
    let droptext

    if (Utility.checkSetHidden(data, this.props.object_sets)) return null

    //Child outcomes. See comment in models/outcome.py for more info.
    if (this.state.is_dropped)
      children = data.child_outcome_links.map((outcomeoutcome) => (
        <OutcomeBarOutcomeOutcome
          key={outcomeoutcome}
          objectID={outcomeoutcome}
          parentID={data.id}
          readOnly={this.props.readOnly}
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
        window.ngettext(
          'descendant',
          'descendants',
          data.child_outcome_links.length
        )

    return (
      <div
        className={
          'outcome' +
          ((this.state.is_dropped && ' dropped') || '') +
          ' outcome-' +
          data.id
        }
        ref={this.mainDiv}
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
const mapOutcomeBarOutcomeStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => ({
  ...getOutcomeByID(state, ownProps.objectID),
  nodes: state.outcomenode
    .filter((outcomeNode) => outcomeNode.outcome == ownProps.objectID)
    .map((outcomeNode) => outcomeNode.node),
  horizontaloutcomes: state.outcomehorizontallink
    .filter((ochl) => ochl.parent_outcome == ownProps.objectID)
    .map((ochl) => ochl.outcome)
})

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const OutcomeBarOutcome = connect<ConnectedProps, object, OwnProps, AppState>(
  mapOutcomeBarOutcomeStateToProps,
  null
)(OutcomeBarOutcomeUnconnected)

export default OutcomeBarOutcome
