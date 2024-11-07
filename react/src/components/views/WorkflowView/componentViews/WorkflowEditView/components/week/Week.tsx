import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { UtilityLoaderClass } from '@cf/utility/UtilityLoader.class'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import EditableComponentWithSorting, {
  EditableComponentWithSortingProps,
  EditableComponentWithSortingState
} from '@cfEditableComponents/EditableComponentWithSorting'
import { HoverMenu } from '@cfEditableComponents/hoverEditActions'
import { TGetWeekByIDType, getWeekById } from '@cfFindState'
import ActionCreator from '@cfRedux/ActionCreator'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import NodeWeek from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeWeek'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import { Dispatch } from '@reduxjs/toolkit'
import { addStrategyQuery } from '@XMLHTTP/API/create'
import { columnChanged, insertedAt } from '@XMLHTTP/postTemp.js'
import * as React from 'react'
import { connect } from 'react-redux'
import { Action } from 'redux'

const choices = COURSEFLOW_APP.globalContextData.workflowChoices

// import $ from 'jquery'

type ConnectedProps = {
  week: TGetWeekByIDType
  workflow: TWorkflow
}

type OwnProps = {
  objectId: number
  parentId: number
  throughParentId: number
  rank?: number
  columnOrder?: any // @todo i think this is delivered by redux
  nodesByColumn?: any
} & EditableComponentWithSortingProps & { dispatch?: Dispatch<Action> }

export type WeekUnconnectedPropsType = OwnProps

type PropsType = OwnProps & ConnectedProps

/**
 * Renders a standard 'week-style' block of nodes, wherein the
 * nodes appear one above the other, never side by side
 */
class WeekUnconnected<P extends PropsType> extends EditableComponentWithSorting<
  P,
  EditableComponentWithSortingState
> {
  protected nodeBlock: React.RefObject<HTMLDivElement>
  protected manager: BetterSelectionManager
  private mainDiv: React.RefObject<HTMLDivElement>
  private objectType: CfObjectType

  constructor(props: P) {
    super(props)

    this.manager = new BetterSelectionManager(this.props.dispatch)
    this.objectType = CfObjectType.WEEK
    this.nodeBlock = React.createRef()
    this.mainDiv = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeDragAndDrop()
  }

  componentDidUpdate() {
    this.makeDragAndDrop()
    ThemeHelper.triggerHandlerEach(
      $(this.mainDiv.current).find('.node'),
      'component-updated'
    )
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  makeDragAndDrop() {
    //Makes the nodeweeks in the node block draggable
    this.makeSortableNode(
      $(this.nodeBlock.current).children('.node-week').not('.ui-draggable'),
      this.props.objectId,
      'nodeweek',
      '.node-week',
      false,
      // @ts-ignore
      [200, 1],
      null,
      '.node',
      '.week-block'
    )
    this.makeDroppable()
  }

  sortableColumnChangedFunction(id, deltaX, oldColumn) {
    const columns = this.props.columnOrder
    const oldColumnIndex = columns.indexOf(oldColumn)
    const newColumnIndex = oldColumnIndex + deltaX
    if (newColumnIndex < 0 || newColumnIndex >= columns.length) {
      return
    }
    const newColumn = columns[newColumnIndex]

    //legacy: hack debouncer
    // @todo ...
    // @ts-ignore
    if (this.recentlySentColumnChange) {
      if (
        // @ts-ignore
        this.recentlySentColumnChange.column === newColumn &&
        // @ts-ignore
        Date.now() - this.recentlySentColumnChange.lastCall <= 500
      ) {
        // @ts-ignore
        this.recentlySentColumnChange.lastCall = Date.now()
        return
      }
    }

    // @ts-ignore
    this.recentlySentColumnChange = {
      column: newColumn,
      lastCall: Date.now()
    }

    this.lockChild(id, true, CfObjectType.NODEWEEK)

    // assign the node to a new column within the week
    this.context.editableMethods.microUpdate(
      ActionCreator.columnChangeNode(id, newColumn)
    )
    columnChanged(this.context, id, newColumn) // @todo drag action needs to be designed and is not on renderer (context) anymore
  }

  sortableMovedFunction(id, newPosition, type, newParent, childId) {
    //Correction for if we are in a term
    if (this.props.nodesByColumn) {
      for (const col in this.props.nodesByColumn) {
        if (this.props.nodesByColumn[col].indexOf(id) >= 0) {
          const previous = this.props.nodesByColumn[col][newPosition]
          newPosition = this.props.week.data.nodeweekSet.indexOf(previous)
        }
      }
    }

    this.context.editableMethods.microUpdate(
      ActionCreator.moveNodeWeek(id, newPosition, newParent, childId)
    )
    insertedAt(
      this.context.selectionManager,
      childId,
      'node',
      newParent,
      'week',
      newPosition,
      'nodeweek'
    )
  }

  makeDroppable() {
    const props = this.props
    $(this.mainDiv?.current).droppable({
      tolerance: 'pointer',
      // @ts-ignore
      droppable: '.strategy-ghost',
      over: (e, ui) => {
        const dropItem = $(e.target)
        const dragItem = ui.draggable
        const dragHelper = ui.helper

        if (dragItem.hasClass('new-strategy')) {
          dragHelper.addClass('valid-drop')
          dropItem.addClass('new-strategy-drop-over')
        } else {
          return
        }
      },
      out: (e, ui) => {
        const dragItem = ui.draggable
        const dragHelper = ui.helper
        const dropItem = $(e.target)
        if (dragItem.hasClass('new-strategy')) {
          dragHelper.removeClass('valid-drop')
          dropItem.removeClass('new-strategy-drop-over')
        }
      },
      drop: (e, ui) => {
        $('.new-strategy-drop-over').removeClass('new-strategy-drop-over')
        const dropItem = $(e.target)
        const dragItem = ui.draggable
        const newIndex = dropItem.parent().prevAll().length + 1
        if (dragItem.hasClass('new-strategy')) {
          const loader = new UtilityLoaderClass('body')
          addStrategyQuery(
            this.props.parentId,
            newIndex,
            // @todo HACK, this is being used to bypass react and pass information around the DOM
            // @ts-ignore
            dragItem[0].dataDraggable.strategy,
            (responseData) => {
              loader.endLoad()
            }
          )
        }
      }
    })
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  Nodes = ({ nodeweekSet }: { nodeweekSet: any }) => {
    if (!nodeweekSet?.length) {
      return (
        <div className="node-week placeholder" style={{ height: '100%' }}>
          Drag and drop nodes from the sidebar to add.
        </div>
      )
    }
    return this.props.week.data.nodeweekSet.map((nodeId) => (
      <NodeWeek
        key={nodeId}
        objectId={nodeId}
        parentId={this.props.week.data.id}
        columnOrder={this.props.week.columnOrder}
      />
    ))
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.week.data

    const cssClasses = [
      'week',
      data.isStrategy ? 'strategy' : '',
      data.lock ? 'locked locked-' + data.lock.userId : '',
      data.isDropped ? ' dropped' : ''
    ].join(' ')

    const defaultText = !this.props.workflow.isStrategy
      ? data.weekTypeDisplay + ' ' + (this.props.rank + 1)
      : undefined

    // there's a helper function for this
    const style: React.CSSProperties = {
      border: data.lock ? '2px solid ' + data.lock.userColour : undefined
    }

    // @todo this will go when the new sidebar is done
    // const portal = this.addEditable(data)
    const dropIcon = data.isDropped ? (
      <ArrowDropDownIcon />
    ) : (
      <ArrowDropUpIcon />
    )
    return (
      <>
        <div
          style={style}
          className={cssClasses}
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
          <div className="mouseover-container-bypass">
            <HoverMenu
              canWrite={
                this.props.workflow.workflowPermissions.write &&
                !this.props.workflow.isStrategy
              }
              canComment={this.props.workflow.workflowPermissions.viewComments}
              objectId={this.props.objectId}
              parentId={this.props.parentId}
              objectType={this.objectType}
            />
          </div>

          <TitleText text={data.title} defaultText={defaultText} />

          <div
            className="node-block"
            id={this.props.objectId + '-node-block'}
            ref={this.nodeBlock}
          >
            <this.Nodes nodeweekSet={this.props.week.data.nodeweekSet} />
          </div>

          <div
            className="week-drop-row hover-shade"
            onClick={(evt) => {
              evt.stopPropagation()
              this.manager.toggleDropReduxAction({
                objectId: this.props.objectId,
                objectType: Constants.objectDictionary[
                  this.objectType
                ] as CfObjectType,
                newDropState: !this.props.week.data?.isDropped
              })
            }}
          >
            <div
              style={{
                textAlign: 'center',
                width: '100%',
                height: '100%'
              }}
            >
              {dropIcon}
            </div>
          </div>

          {data.strategyClassification > 0 && (
            <div className="strategy-tab">
              <div className="strategy-tab-triangle" />
              <div className="strategy-tab-square">
                <div className="strategy-tab-circle">
                  <img
                    title={
                      choices.strategyClassificationChoices?.find(
                        (obj) => obj.type === data.strategyClassification
                      ).name
                    }
                    src={
                      apiPaths.external.static_assets.icon +
                      Constants.strategyKeys[data.strategyClassification] +
                      '.svg'
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    )
  }
}

const mapWeekStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  return {
    week: getWeekById(state, ownProps.objectId),
    workflow: state.workflow
  }
}

const Week = connect<ConnectedProps, object, OwnProps, AppState>(
  mapWeekStateToProps,
  null
)(WeekUnconnected)

export default Week
export { WeekUnconnected }
