import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import { _t } from '@cf/utility/Utility.class'
import Utility from '@cf/utility/Utility.class'
import { OutcomeTitle } from '@cfComponents/UIPrimitives/Titles.ts'
import EditableComponentWithSorting from '@cfEditableComponents/EditableComponentWithSorting'
import {
  EditableComponentWithSortingProps,
  EditableComponentWithSortingState
} from '@cfEditableComponents/EditableComponentWithSorting'
import {
  DeleteSelfButton,
  DuplicateSelfButton,
  InsertSiblingButton
} from '@cfEditableComponents/hoverEditActions'
import { TGetOutcomeByID, getOutcomeByID } from '@cfFindState'
import ActionCreator from '@cfRedux/ActionCreator'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import { updateOutcomehorizontallinkDegree } from '@XMLHTTP/API/update'
import { insertedAtInstant } from '@XMLHTTP/API/update'
import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import * as React from 'react'
import { connect } from 'react-redux'

import OutcomeHorizontalLink from './OutcomeHorizontalLink'
import OutcomeOutcome from './OutcomeOutcome'

// import $ from 'jquery'

type ConnectedProps = {
  outcome: TGetOutcomeByID
  workflow: TWorkflow
}
type OwnProps = {
  throughParentId?: number
  showHorizontal?: boolean
} & EditableComponentWithSortingProps

type StateProps = {
  showHorizontalLinks: boolean
} & EditableComponentWithSortingState

type PropsType = ConnectedProps & OwnProps

/**
 * Basic component representing an outcome
 */
class OutcomeUnconnected extends EditableComponentWithSorting<
  PropsType,
  StateProps
> {
  private childrenBlock: React.RefObject<HTMLOListElement>
  private manager: BetterSelectionManager

  constructor(props: PropsType) {
    super(props)
    this.manager = new BetterSelectionManager(this.props.dispatch)
    this.objectType = CfObjectType.OUTCOME

    // @todo i'm sure this check does something, but it's obscure, to verify
    // if (props.data.depth === 0)
    // {
    //   this.objectType = this.objectType.OUTCOME
    // }
    this.childrenBlock = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    if (this.props.showHorizontal) {
      this.makeDragAndDrop()
    }
  }

  componentDidUpdate() {
    if (this.props.showHorizontal) {
      this.makeDragAndDrop()
    }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  makeDragAndDrop() {
    this.makeSortableNode(
      $(this.childrenBlock.current)
        .children('.outcome-outcome')
        .not('ui-draggable'),
      this.props.objectId,
      'outcomeoutcome',
      '.outcome-outcome-' + this.props.outcome.data.depth,
      false,
      false,
      '#workflow-' + this.props.workflow.id,
      '.outcome'
    )
    if (this.props.outcome.data.depth === 0) {
      this.makeDroppable()
    }
  }

  sortableMovedFunction(id, newPosition, type, newParent, childId) {
    this.context.editableMethods.microUpdate(
      ActionCreator.moveOutcomeOutcome(id, newPosition, newParent, childId)
    )
    insertedAt(
      this.context.selectionManager,
      childId,
      'outcome',
      newParent,
      'outcome',
      newPosition,
      'outcomeoutcome'
    )
  }

  stopSortFunction() {}

  sortableMovedOutFunction(id, newPosition, type, newParent, childId) {
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
        newParent,
        'outcome',
        newPosition,
        'outcomeoutcome'
      )
      insertedAtInstant(
        childId,
        'outcome',
        newParent,
        'outcome',
        newPosition,
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
        const dropItem = $(e.target)
        const dragItem = ui.draggable
        if (dragItem.hasClass('outcome')) {
          COURSEFLOW_APP.tinyLoader.startLoad()
          updateOutcomehorizontallinkDegree(
            props.objectId,
            // @todo HACK, this is being used to bypass react and pass information around the DOM
            // @ts-ignore
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

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  HoverMenu = () => {
    const mouseoverActions = []
    if (this.props.workflow.workflowPermissions.write) {
      mouseoverActions.push(
        <InsertSiblingButton
          id={this.props.objectId}
          objectType={this.objectType}
          parentId={this.props.parentId}
        />
      )
      mouseoverActions.push(
        <DuplicateSelfButton
          id={this.props.objectId}
          objectType={this.objectType}
          parentId={this.props.parentId}
        />
      )
      mouseoverActions.push(
        <DeleteSelfButton
          id={this.props.objectId}
          objectType={this.objectType}
        />
      )
    }

    if (this.props.workflow.workflowPermissions.addComments) {
      mouseoverActions.push(<this.AddCommenting />)
    }
    return mouseoverActions
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.outcome.data
    let children
    let outcomehorizontallinks
    const sideActions = []

    if (Utility.checkSetHidden(data, this.props.objectSets)) {
      return null
    }
    //Child outcomes. See comment in models/outcome.py for more info.
    if (data.isDropped) {
      children = data.childOutcomeLinks.map((outcomeoutcome) => (
        <OutcomeOutcome
          key={outcomeoutcome}
          objectId={outcomeoutcome}
          parentId={data.id}
          // renderer={this.context}
          showHorizontal={this.props.showHorizontal}
          parentDepth={this.props.outcome.data.depth}
        />
      ))
    }

    if (this.state.showHorizontalLinks) {
      outcomehorizontallinks = (
        <div
          className={'outcome-node-container'}
          onMouseLeave={() => {
            this.setState({
              showHorizontalLinks: false
            })
          }}
        >
          {data.outcomeHorizontalLinksUnique.map((horizontalLink) => (
            <OutcomeHorizontalLink
              key={horizontalLink}
              objectId={horizontalLink}
              // renderer={this.context}
            />
          ))}
        </div>
      )
    }

    if (
      this.props.showHorizontal &&
      data.outcomeHorizontalLinksUnique.length > 0
    ) {
      sideActions.push(
        <div className="outcome-node-indicator">
          <div
            className={'outcome-node-indicator-number'}
            onMouseEnter={() => {
              this.setState({
                showHorizontalLinks: true
              })
            }}
          >
            {data.outcomeHorizontalLinksUnique.length}
          </div>
          {outcomehorizontallinks}
        </div>
      )
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
      this.props.workflow.workflowPermissions.write &&
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
          //          this.addEditable(data)
        }
        <div
          style={style}
          className={cssClass}
          ref={this.mainDiv}
          onClick={(e) => {
            e.stopPropagation()
            this.manager.updateSidebar(
              data.id,
              this.objectType,
              this.props.parentId
            )
          }}
        >
          <div className="outcome-title">
            <OutcomeTitle
              title={this.props.outcome.data.title}
              prefix={this.props.outcome.prefix}
              hovertext={this.props.outcome.hovertext}
            />
          </div>

          {data.depth < 2 && data.childOutcomeLinks.length > 0 && (
            <div
              className="outcome-drop"
              onClick={(evt) => {
                evt.stopPropagation()
                this.manager.toggleDropReduxAction({
                  objectId: this.props.objectId,
                  objectType: Constants.objectDictionary[this.objectType] as CfObjectType,
                  newDropState: !this.props.data?.isDropped
                })
              }}
            >
              <div className="outcome-drop-img">
                <img
                  src={apiPaths.external.static_assets.icon + dropIcon + '.svg'}
                />
              </div>
              <div className="outcome-drop-text">{droptext}</div>
            </div>
          )}

          {data.depth < 2 && (
            <ol
              className={
                'children-block children-block-' + this.props.outcome.data.depth
              }
              id={this.props.objectId + '-children-block'}
              ref={this.childrenBlock}
            >
              {children}
            </ol>
          )}

          {this.props.workflow.workflowPermissions.write && data.depth < 2 && (
            <div
              className="outcome-create-child"
              onClick={
                () => {}
                // @todo update this with mutation
                // insertChild({
                //   id: this.props.objectId,
                //   objectType: this.objectType
                // })
              }
            >
              {_t('+ Add New')}
            </div>
          )}

          <div className="mouseover-actions">
            <this.HoverMenu />
          </div>

          <div className="side-actions">
            {sideActions}
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
