import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import { OutcomeTitle } from '@cfComponents/UIPrimitives/Titles.ts'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfEditableComponents/ComponentWithToggleDrop'
import { TGetOutcomeByID, getOutcomeByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import { updateOutcomenodeDegree } from '@XMLHTTP/API/update'
import * as React from 'react'
import { connect } from 'react-redux'
// import $ from 'jquery'

type TableCellPropsType = {
  outcomesType: number
  total?: boolean
  readOnly: boolean
  degree: number
  nodeID?: number
  outcomeID?: number
  grandTotal?: boolean
  // renderer={this.props.renderer}
}

/**
 *
 */
class TableCell extends React.Component<TableCellPropsType> {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  toggleFunction() {
    let value
    if (this.props.degree) value = 0
    else value = 1
    COURSEFLOW_APP.tinyLoader.startLoad()
    updateOutcomenodeDegree(
      this.props.nodeID,
      this.props.outcomeID,
      value,
      (responseData) => {
        COURSEFLOW_APP.tinyLoader.endLoad()
      }
    )
  }

  changeFunction(evt) {
    const value = evt.target.value
    COURSEFLOW_APP.tinyLoader.startLoad()
    updateOutcomenodeDegree(
      this.props.nodeID,
      this.props.outcomeID,
      value,
      (responseData) => {
        COURSEFLOW_APP.tinyLoader.endLoad()
        $(':focus').blur()
      }
    )
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/

  Contents = ({ completionStatus, selfCompletion }) => {
    if (completionStatus === 0) {
      return <img src={`${apiPaths.external.static_assets.icon}nocheck.svg`} />
    } else if (!completionStatus) {
      return ''
    }

    if (this.props.outcomesType === 0 || completionStatus & 1) {
      const icon = selfCompletion ? 'solid_check.svg' : 'check.svg'
      return (
        <img
          className={selfCompletion ? 'self-completed' : ''}
          src={`${apiPaths.external.static_assets.icon}${icon}`}
        />
      )
    }

    const outcomes = [
      { bit: 2, label: 'I' },
      { bit: 4, label: 'D' },
      { bit: 8, label: 'A' }
    ]

    return outcomes
      .filter(({ bit }) => completionStatus & bit)
      .map(({ bit, label }) => (
        <div
          className={`outcome-degree${
            selfCompletion & bit ? ' self-completed' : ''
          }`}
          key={label}
        >
          {label}
        </div>
      ))
  }

  Input = () => {
    const degree = this.props.degree
    const checked = !!degree

    if (this.props.readOnly || this.props.total) {
      return <></>
    }

    if (this.props.outcomesType === 0) {
      return (
        <input
          type="checkbox"
          onChange={this.toggleFunction.bind(this)}
          checked={checked}
        />
      )
    }

    return (
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

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const classNames = [
      'table-cell',
      this.props.total ? 'total-cell' : '',
      this.props.grandTotal ? 'grand-total-cell' : ''
    ].join(' ')

    return (
      // <div className={classNames} ref={this.mainDiv}> // @todo verify i don't think mainDiv is defined here
      <div className={classNames}>
        <this.Contents
          completionStatus={this.props.degree}
          selfCompletion={!this.props.total}
        />
        <this.Input />
      </div>
    )
  }
}

type ConnectedProps = TGetOutcomeByID

// @todo no idea what's required props here
type OwnProps = {
  parentID?: number
  throughParentID?: number
  renderer?: any
  show_horizontal?: boolean
  comments?: boolean
  edit?: boolean
  outcome_tree?: any
  nodecategory?: any
  outcomesType?: any
  updateParentCompletion?: any
  completion_status_from_parents?: any
  readOnly?: boolean
} & ComponentWithToggleProps
type PropsType = ConnectedProps & OwnProps

/**
 *
 */
export class OutcomeUnconnected<
  P extends PropsType,
  S
> extends ComponentWithToggleDrop<P, S> {
  constructor(props: P) {
    super(props)
    this.objectType = CfObjectType.OUTCOME
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getIsDropped() {
    return this.props.data.isDropped
  }

  ChildOutcomeView = ({ child }) => {
    return (
      <Outcome
        outcomesType={this.props.outcomesType}
        objectId={child.id}
        outcome_tree={child}
        // renderer={this.props.renderer}
      />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const isDropped = this.getIsDropped()
    // let dropIcon
    const dropIcon = isDropped ? 'droptriangleup' : 'droptriangledown'

    const droptext = isDropped
      ? _t('hide')
      : _t('show ') +
        data.childOutcomeLinks.length +
        ' ' +
        window.ngettext(
          'descendant',
          'descendants',
          data.childOutcomeLinks.length
        )

    // let comments

    // let style

    const outcome_head = (
      <div className="outcome-wrapper">
        <div
          className="outcome-head"
          ref={this.mainDiv}
          style={{
            paddingLeft: data.depth * 12
          }}
        >
          {/*<div className="outcome-title" style={style}> @todo style is not defined */}
          <div className="outcome-title">
            <OutcomeTitle
              title={this.props.data.title}
              prefix={this.props.prefix}
              hovertext={this.props.hovertext}
            />
          </div>
          {data.childOutcomeLinks.length > 0 && (
            <div className="outcome-drop" onClick={this.toggleDrop.bind(this)}>
              <div className="outcome-drop-img">
                <img
                  src={apiPaths.external.static_assets.icon + dropIcon + '.svg'}
                />
              </div>
              <div className="outcome-drop-text">{droptext}</div>
            </div>
          )}
          {/*<div className="mouseover-actions">{comments}</div> @todo comments is not defined */}
          <div className="side-actions">
            <div className="comment-indicator-container" />
          </div>
        </div>
      </div>
    )

    const outcome_row = this.props.outcome_tree?.outcomenodes?.map(
      (outcomenodegroup) => {
        const group_row = outcomenodegroup?.map((outcomenode) => (
          <TableCell
            outcomesType={this.props.outcomesType}
            degree={outcomenode.degree}
            readOnly={this.props.readOnly}
            nodeID={outcomenode.nodeId}
            outcomeID={this.props.outcome_tree.id}
            // renderer={this.props.renderer}
          />
        ))

        group_row.unshift(
          <TableCell
            outcomesType={this.props.outcomesType}
            readOnly={this.props.readOnly}
            total={true}
            degree={outcomenodegroup.total}
            // renderer={this.props.renderer}
          />
        )
        return (
          <div className="table-group">
            <div className="table-cell blank-cell" />
            {group_row}
          </div>
        )
      }
    )

    outcome_row.push(<div className="table-cell blank-cell" />)
    outcome_row.push(
      <TableCell
        outcomesType={this.props.outcomesType}
        degree={this.props.outcome_tree.outcomenodes.total}
        readOnly={this.props.readOnly}
        total={true}
        grandTotal={true}
        // renderer={this.props.renderer}
      />
    )
    const full_row = (
      <div className={'outcome-row depth-' + data.depth}>
        {outcome_head}
        <div className="outcome-cells">{outcome_row}</div>
      </div>
    )

    let child_rows
    if (isDropped)
      child_rows = this.props.outcome_tree.children.map((child) => (
        <this.ChildOutcomeView child={child} />
      ))
    return [full_row, child_rows]
  }
}

const mapOutcomeStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TGetOutcomeByID => {
  return getOutcomeByID(state, ownProps.objectId)
}
/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const Outcome = connect<ConnectedProps, object, OwnProps, AppState>(
  mapOutcomeStateToProps,
  null
)(OutcomeUnconnected)

export default Outcome

// Contents = ({completionStatus}, {selfCompletion}) => {
//     const contents = []
//     let divclass = ''
//
//     if (completionStatus === 0) {
//       return <img src={ apiPaths.external.static_assets.icon + 'nocheck.svg'} />
//     } else if (!completionStatus) {
//       return ''
//     }
//     if (this.props.outcomesType === 0 || completionStatus & 1) {
//       if (selfCompletion)
//         return (
//           <img
//             className="self-completed"
//             src={ apiPaths.external.static_assets.icon + 'solid_check.svg'}
//           />
//         )
//       else return <img src={ apiPaths.external.static_assets.icon + 'check.svg'} />
//     }
//
//     // @todo why is bitwise being used here? needs explanation comments
//     if (completionStatus & 2) {
//       if (selfCompletion & 2) divclass = ' self-completed'
//       contents.push(
//         <div className={'outcome-introduced outcome-degree' + divclass}>I</div>
//       )
//     }
//     if (completionStatus & 4) {
//       if (selfCompletion & 4) divclass = ' self-completed'
//       contents.push(
//         <div className={'outcome-developed outcome-degree' + divclass}>D</div>
//       )
//     }
//     if (completionStatus & 8) {
//       if (selfCompletion & 8) divclass = ' self-completed'
//       contents.push(
//         <div className={'outcome-advanced outcome-degree' + divclass}>A</div>
//       )
//     }
//     return contents
//   }
