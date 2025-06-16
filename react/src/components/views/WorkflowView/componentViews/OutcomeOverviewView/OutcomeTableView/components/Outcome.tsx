import { updateOutcomenodeDegree } from '@cf/HTTP/XMLHTTP/API/update'
import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum.js'
import { _t } from '@cf/utility/Utility.class'
import { OutcomeTitle } from '@cfComponents/UIPrimitives/Titles.ts'
import { getOutcomeByID } from '@cfFindState'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { AppState } from '@cfRedux/types/type'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

type TableCellPropsType = {
  outcomesType: number
  total?: boolean
  readOnly: boolean
  degree: number
  nodeId?: number
  outcomeID?: number
  grandTotal?: boolean
  // renderer={this.props.renderer}
}

class TableCell extends React.Component<TableCellPropsType> {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  toggleFunction() {
    let value
    if (this.props.degree) {
      value = 0
    } else {
      value = 1
    }

    updateOutcomenodeDegree(
      this.props.nodeId,
      this.props.outcomeID,
      value,
      (responseData) => {

      }
    )
  }

  changeFunction(evt) {
    const value = evt.target.value

    updateOutcomenodeDegree(
      this.props.nodeId,
      this.props.outcomeID,
      value,
      (responseData) => {

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

type PropsType = {
  objectId: number
  parentId?: number
  throughParentId?: number
  renderer?: any
  showHorizontal?: boolean
  comments?: boolean
  edit?: boolean
  outcomeTree?: any
  nodecategory?: any
  outcomesType?: any
  updateParentCompletion?: any
  completionStatusFromParents?: any
  readOnly?: boolean
}

const Outcome = (props: PropsType) => {
  const data = useSelector(
    (state: AppState) => getOutcomeByID(state, props.objectId).data
  )
  const outcomeTree = props.outcomeTree
  const outcomesType = props.outcomesType
  const readOnly = props.readOnly

  const dispatch = useDispatch()
  const mainDiv = useRef<HTMLDivElement>(null)
  const manager = useRef(new BetterSelectionManager(dispatch))
  const objectType = CfObjectType.OUTCOME

  useEffect(() => {
    console.log('Outcome is somewhere on the page')
  }, [])

  const getIsDropped = () => data.isDropped

  const toggleDrop = () => {
    manager.current.toggleDropReduxAction({
      objectId: props.objectId,
      objectType,
      newDropState: !data.isDropped,
      depth: data.depth
    })
  }

  const ChildOutcomeView = ({ child }) => (
    <Outcome
      outcomesType={outcomesType}
      objectId={child.id}
      outcomeTree={child}
    />
  )

  const dropIcon = getIsDropped() ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />
  const dropText = getIsDropped()
    ? _t('hide')
    : `${_t('show')} ${data.childOutcomeLinks.length} ${window.ngettext('descendant', 'descendants', data.childOutcomeLinks.length)}`

  const outcomeHead = (
    <div className="outcome-wrapper">
      <div
        className="outcome-head"
        ref={mainDiv}
        style={{ paddingLeft: data.depth * 12 }}
      >
        <div className="outcome-title">
          <OutcomeTitle
            title={data.title}
            prefix={props.prefix}
            hovertext={props.hovertext}
          />
        </div>
        {data.childOutcomeLinks.length > 0 && (
          <div className="outcome-drop" onClick={toggleDrop}>
            <div className="outcome-drop-img">{dropIcon}</div>
            <div className="outcome-drop-text">{dropText}</div>
          </div>
        )}
        <div className="side-actions">
          <div className="comment-indicator-container" />
        </div>
      </div>
    </div>
  )

  const outcomeRow = outcomeTree?.outcomenodes?.map((outcomenodegroup) => {
    const groupRow = outcomenodegroup?.map((outcomenode) => (
      <TableCell
        outcomesType={outcomesType}
        degree={outcomenode.degree}
        readOnly={readOnly}
        nodeId={outcomenode.nodeId}
        outcomeID={outcomeTree.id}
      />
    ))

    groupRow.unshift(
      <TableCell
        outcomesType={outcomesType}
        readOnly={readOnly}
        total={true}
        degree={outcomenodegroup.total}
      />
    )

    return (
      <div className="table-group">
        <div className="table-cell blank-cell" />
        {groupRow}
      </div>
    )
  })

  outcomeRow.push(<div className="table-cell blank-cell" />)
  outcomeRow.push(
    <TableCell
      outcomesType={outcomesType}
      degree={outcomeTree.outcomenodes.total}
      readOnly={readOnly}
      total={true}
      grandTotal={true}
    />
  )

  const fullRow = (
    <div className={`outcome-row depth-${data.depth}`}>
      {outcomeHead}
      <div className="outcome-cells">{outcomeRow}</div>
    </div>
  )

  const childRows = getIsDropped()
    ? outcomeTree.children.map((child) => (
        <ChildOutcomeView key={child.id} child={child} />
      ))
    : null

  return (
    <>
      {fullRow}
      {childRows}
    </>
  )
}

export default Outcome

// import { apiPaths } from '@cf/router/apiRoutes'
// import { CfObjectType } from '@cf/types/enum'
// import { _t } from '@cf/utility/Utility.class'
// import { OutcomeTitle } from '@cfComponents/UIPrimitives/Titles.ts.tsx'
// import { TGetOutcomeByID, getOutcomeByID } from '@cfFindState'
// import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
// import { AppState } from '@cfRedux/types/type'
// import { toggleExpand } from '@cfRedux/utility/helpers'
// import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
// import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
// import { updateOutcomenodeDegree } from '@XMLHTTP/API/update'
// import * as React from 'react'
// import { connect } from 'react-redux'
// // import $ from 'jquery'
//
// type TableCellPropsType = {
//   outcomesType: number
//   total?: boolean
//   readOnly: boolean
//   degree: number
//   nodeId?: number
//   outcomeID?: number
//   grandTotal?: boolean
//   // renderer={this.props.renderer}
// }
//
// /**
//  *
//  */

// type ConnectedProps = TGetOutcomeByID
//
// // @todo no idea what's required props here
// type OwnProps = {
//   objectId: number
//   parentId?: number
//   throughParentId?: number
//   renderer?: any
//   showHorizontal?: boolean
//   comments?: boolean
//   edit?: boolean
//   outcomeTree?: any
//   nodecategory?: any
//   outcomesType?: any
//   updateParentCompletion?: any
//   completionStatusFromParents?: any
//   readOnly?: boolean
// }
// type PropsType = ConnectedProps & OwnProps
//
// /**
//  *
//  */
// export class OutcomeUnconnected<P extends PropsType, S> extends React.Component<
//   P,
//   S
// > {
//   objectType: CfObjectType
//   mainDiv: React.RefObject<HTMLDivElement>
//   protected manager: BetterSelectionManager
//
//   constructor(props: P) {
//     super(props)
//     this.mainDiv = React.createRef()
//     this.objectType = CfObjectType.OUTCOME
//     this.manager = new BetterSelectionManager(this.props.dispatch)
//   }
//
//   componentDidMount() {
//     console.log('outcome is somewhere on the page ')
//     console.log(' dispatch: this.props?.dispatch, // @todo where is dispatch ')
//   }
//
//   /*******************************************************
//    * FUNCTIONS
//    *******************************************************/
//   getIsDropped() {
//     return this.props.data.isDropped
//   }
//
//   ChildOutcomeView = ({ child }) => {
//     return (
//       <Outcome
//         outcomesType={this.props.outcomesType}
//         objectId={child.id}
//         outcomeTree={child}
//         // renderer={this.props.renderer}
//       />
//     )
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const data = this.props.data
//     const isDropped = this.getIsDropped()
//     // let dropIcon
//     const dropIcon = isDropped ? 'droptriangleup' : 'droptriangledown'
//
//     const droptext = isDropped
//       ? _t('hide')
//       : _t('show ') +
//         data.childOutcomeLinks.length +
//         ' ' +
//         window.ngettext(
//           'descendant',
//           'descendants',
//           data.childOutcomeLinks.length
//         )
//
//     const outcomeHead = (
//       <div className="outcome-wrapper">
//         <div
//           className="outcome-head"
//           ref={this.mainDiv}
//           style={{
//             paddingLeft: data.depth * 12
//           }}
//         >
//           {/*<div className="outcome-title" style={style}> @todo style is not defined */}
//           <div className="outcome-title">
//             <OutcomeTitle
//               title={this.props.data.title}
//               prefix={this.props.prefix}
//               hovertext={this.props.hovertext}
//             />
//           </div>
//           {data.childOutcomeLinks.length > 0 && (
//             <div
//               className="outcome-drop"
//               onClick={(evt) => {
//                 evt.stopPropagation()
//                 this.manager.toggleDropReduxAction({
//                   objectId: this.props.objectId,
//                   objectType: this.objectType,
//                   newDropState: !this.props.data?.isDropped,
//                   depth: this.props.data?.depth
//                 })
//               }}
//             >
//               <div className="outcome-drop-img">
//                 <ArrowDropDownIcon />
//               </div>
//               <div className="outcome-drop-text">{droptext}</div>
//             </div>
//           )}
//           {/*<div className="mouseover-actions">{comments}</div> @todo comments is not defined */}
//           <div className="side-actions">
//             <div className="comment-indicator-container" />
//           </div>
//         </div>
//       </div>
//     )
//
//     const outcomeRow = this.props.outcomeTree?.outcomenodes?.map(
//       (outcomenodegroup) => {
//         const groupRow = outcomenodegroup?.map((outcomenode) => (
//           <TableCell
//             outcomesType={this.props.outcomesType}
//             degree={outcomenode.degree}
//             readOnly={this.props.readOnly}
//             nodeId={outcomenode.nodeId}
//             outcomeID={this.props.outcomeTree.id}
//           />
//         ))
//
//         groupRow.unshift(
//           <TableCell
//             outcomesType={this.props.outcomesType}
//             readOnly={this.props.readOnly}
//             total={true}
//             degree={outcomenodegroup.total}
//           />
//         )
//         return (
//           <div className="table-group">
//             <div className="table-cell blank-cell" />
//             {groupRow}
//           </div>
//         )
//       }
//     )
//
//     outcomeRow.push(<div className="table-cell blank-cell" />)
//     outcomeRow.push(
//       <TableCell
//         outcomesType={this.props.outcomesType}
//         degree={this.props.outcomeTree.outcomenodes.total}
//         readOnly={this.props.readOnly}
//         total={true}
//         grandTotal={true}
//       />
//     )
//     const fullRow = (
//       <div className={'outcome-row depth-' + data.depth}>
//         {outcomeHead}
//         <div className="outcome-cells">{outcomeRow}</div>
//       </div>
//     )
//
//     let childRows
//     if (isDropped) {
//       childRows = this.props.outcomeTree.children.map((child) => (
//         <this.ChildOutcomeView child={child} />
//       ))
//     }
//     return [fullRow, childRows]
//   }
// }
//
// const mapOutcomeStateToProps = (
//   state: AppState,
//   ownProps: OwnProps
// ): TGetOutcomeByID => {
//   return getOutcomeByID(state, ownProps.objectId)
// }
// /*******************************************************
//  * CONNECT REDUX
//  *******************************************************/
// const Outcome = connect<ConnectedProps, object, OwnProps, AppState>(
//   mapOutcomeStateToProps,
//   null
// )(OutcomeUnconnected)
//
// export default Outcome

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
