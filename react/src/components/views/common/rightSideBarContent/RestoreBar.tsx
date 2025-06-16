import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import { AppState } from '@cfRedux/types/type'
import RestoreBarItem from '@cfViews/common/rightSideBarContent/NodeBar/components/RestoreBarItem'
import {
  EColumn,
  ENode,
  ENodelink,
  EOutcome,
  EWeek
} from '@XMLHTTP/types/entity'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'

/**
 * The delete/restore tab of the right sidebar in the workflow view.
 */
const RestoreBar = () => {
  const { weeks, columns, nodes, outcomes, nodelinks } = useSelector<
    AppState,
    {
      weeks: EWeek[]
      columns: EColumn[]
      nodes: ENode[]
      outcomes: EOutcome[]
      nodelinks: ENodelink[]
    }
  >((state) => ({
    weeks: state.workspace.week.filter((x) => x.deleted),
    columns: state.workspace.column.filter((x) => x.deleted),
    nodes: state.workspace.node.filter((x) => x.deleted),
    nodelinks: state.workspace.nodelink.filter((x) => x.deleted),
    outcomes: state.outcome.filter((x) => x.deleted)
  }))

  useEffect(() => {
    const checkVisible = () => {
      if (
        nodes.length === 0 &&
        weeks.length === 0 &&
        columns.length === 0 &&
        outcomes.length === 0 &&
        nodelinks.length === 0
      ) {
        $("a[href='#restore-bar']").parent().addClass('hidden')
      } else {
        $("a[href='#restore-bar']").parent().removeClass('hidden')
      }
    }

    checkVisible()
  }, [weeks, columns, nodes, outcomes, nodelinks]) // Dependency array to mimic componentDidUpdate behavior

  return (
    <div id="restore-bar-workflow" className="right-panel-inner">
      <h3>{_t('Restore items')}</h3>
      <hr />
      <h4>{_t('Nodes')}</h4>
      <div className="node-bar-column-block">
        {nodes.map((node) => (
          <RestoreBarItem
            key={node.id}
            objectType={CfObjectType.NODE}
            {...node}
          />
        ))}
      </div>
      <hr />
      <h4>{_t('Weeks')}</h4>
      <div className="node-bar-column-block">
        {weeks.map((week) => (
          <RestoreBarItem
            key={week.id}
            objectType={CfObjectType.WEEK}
            {...week}
          />
        ))}
      </div>
      <hr />
      <h4>{_t('Columns')}</h4>
      <div className="node-bar-column-block">
        {columns.map((column) => (
          <RestoreBarItem
            key={column.id}
            objectType={CfObjectType.COLUMN}
            {...column}
          />
        ))}
      </div>
      <hr />
      <h4>{_t('Outcomes')}</h4>
      <div className="node-bar-column-block">
        {outcomes.map((outcome) => (
          <RestoreBarItem
            key={outcome.id}
            objectType={CfObjectType.OUTCOME}
            {...outcome}
          />
        ))}
      </div>
      <hr />
      <h4>{_t('Node Links')}</h4>
      <div className="node-bar-column-block">
        {nodelinks.map((nodelink) => (
          <RestoreBarItem
            key={nodelink.id}
            objectType={CfObjectType.NODELINK}
            {...nodelink}
          />
        ))}
      </div>
    </div>
  )
}

export default RestoreBar

// type ConnectedProps = {
//   weeks: TWeek[]
//   columns: TColumn[]
//   nodes: TNode[]
//   outcomes: TOutcome[]
//   nodelinks: TNodelink[]
// }
// type OwnProps = NonNullable<unknown>
// type PropsType = ConnectedProps & OwnProps
//
// class RestoreBarUnconnected extends React.Component<PropsType> {
//   constructor(props: PropsType) {
//     super(props)
//   }
//
//   /*******************************************************
//    * LIFECYCLE
//    *******************************************************/
//   componentDidMount() {
//     this.checkVisible()
//   }
//
//   componentDidUpdate() {
//     this.checkVisible()
//   }
//   /*******************************************************
//    * FUNCTIONS
//    *******************************************************/
//   checkVisible() {
//     if (
//       this.props.nodes.length == 0 &&
//       this.props.weeks.length == 0 &&
//       this.props.columns.length == 0 &&
//       this.props.outcomes.length == 0 &&
//       this.props.nodelinks.length == 0
//     ) {
//       $("a[href='#restore-bar']").parent().addClass('hidden')
//     } else {
//       $("a[href='#restore-bar']").parent().removeClass('hidden')
//     }
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const columns = this.props.columns.map((column) => (
//       <RestoreBarItem
//         key={column.id}
//         objectType={CfObjectType.COLUMN}
//         {...column}
//       />
//     ))
//     const weeks = this.props.weeks.map((week) => (
//       <RestoreBarItem key={week.id} objectType={CfObjectType.WEEK} {...week} />
//     ))
//     const nodes = this.props.nodes.map((node) => (
//       <RestoreBarItem key={node.id} objectType={CfObjectType.NODE} {...node} />
//     ))
//     const outcomes = this.props.outcomes.map((outcome) => (
//       <RestoreBarItem
//         key={outcome.id}
//         objectType={CfObjectType.OUTCOME}
//         {...outcome}
//       />
//     ))
//     const nodelinks = this.props.nodelinks.map((nodelink) => (
//       <RestoreBarItem
//         key={nodelink.id}
//         objectType={CfObjectType.NODELINK}
//         {...nodelink}
//       />
//     ))
//
//     return (
//       <div id="restore-bar-workflow" className="right-panel-inner">
//         <h3>{_t('Restore items')}</h3>
//         <hr />
//         <h4>{_t('Nodes')}</h4>
//         <div className="node-bar-column-block">{nodes}</div>
//         <hr />
//         <h4>{_t('Weeks')}</h4>
//         <div className="node-bar-column-block">{weeks}</div>
//         <hr />
//         <h4>{_t('Columns')}</h4>
//         <div className="node-bar-column-block">{columns}</div>
//         <hr />
//         <h4>{_t('Outcomes')}</h4>
//         <div className="node-bar-column-block">{outcomes}</div>
//         <hr />
//         <h4>{_t('Node Links')}</h4>
//         <div className="node-bar-column-block">{nodelinks}</div>
//       </div>
//     )
//   }
// }
// const mapRestoreBarStateToProps = (state: AppState): ConnectedProps => ({
//   weeks: state.week.filter((x) => x.deleted),
//   columns: state.column.filter((x) => x.deleted),
//   nodes: state.node.filter((x) => x.deleted),
//   outcomes: state.outcome.filter((x) => x.deleted),
//   nodelinks: state.nodelink.filter((x) => x.deleted)
// })
// export default connect(mapRestoreBarStateToProps, null)(RestoreBarUnconnected)
