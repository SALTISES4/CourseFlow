import { FieldChoice } from '@cf/types/common'
import { _t } from '@cf/utility/utilityFunctions'
import { AppState } from '@cfRedux/types/type'
import NodeBarColumnWorkflow from '@cfViews/common/rightSideBarContent/NodeBar/components/NodeBarColumnWorkflow'
import Strategy from '@cfViews/common/rightSideBarContent/NodeBar/components/Strategy'
import * as React from 'react'
import { connect } from 'react-redux'

/**
 * The component for the right sidebar's tab in which
 * nodes and strategies can be dragged and added into the workflow
 */

type OwnProps = {
  // renderer: any
  columnChoices: FieldChoice[]
  readOnly: boolean
}

type ConnectedProps = {
  data: AppState['workflow']
  columns: AppState['column']
  availableStrategies: AppState['strategy']
  // saltise_strategies: AppState['saltiseStrategy']
}

type PropsType = OwnProps & ConnectedProps

class NodeBarUnconnected extends React.Component<PropsType> {
  constructor(props: PropsType) {
    super(props)
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let nodebarNodes = []

    const nodebarColumnWorkflows = data.columnworkflowSet.map(
      (columnWorkflow: number, index: number) => (
        <NodeBarColumnWorkflow
          key={`NodeBarColumnWorkflow-${columnWorkflow}`}
          objectId={columnWorkflow}
          columnChoices={this.props.columnChoices}
        />
      )
    )
    const columnsPresent = this.props.columns.map((col) => col.columnType)

    for (let i = 0; i < data.defaultColumns.length; i++) {
      if (columnsPresent.indexOf(data.defaultColumns[i]) < 0) {
        nodebarColumnWorkflows.push(
          <NodeBarColumnWorkflow
            // renderer={this.props.renderer}
            // @todo do we need to pass in objectId ?
            columnType={data.defaultColumns[i]}
            columnChoices={this.props.columnChoices}
          />
        )
      }
    }

    let i // @todo i not defined
    nodebarColumnWorkflows.push(
      <NodeBarColumnWorkflow
        // @ts-ignore
        key={`NodeBarColumnWorkflow-last-${i}`}
        // @todo do we need to pass in objectId ?
        // renderer={this.props.renderer}
        columnType={data.defaultCustomColumn}
        columnChoices={this.props.columnChoices}
      />
    )

    if (!this.props.readOnly) {
      nodebarNodes = [
        <h4>{_t('Nodes')}</h4>,
        <div className="node-bar-column-block">{nodebarColumnWorkflows}</div>
      ]
    }
    const strategies = this.props.availableStrategies.map((strategy) => (
      <Strategy key={strategy.id} objectId={strategy.id} data={strategy} />
    ))
    // const saltise_strategies = this.props.saltise_strategies.map((strategy) => (
    //   <Strategy key={strategy.id} objectId={strategy.id} data={strategy} />
    // ))

    return (
      <div id="node-bar-workflow" className="right-panel-inner">
        <h3 className="drag-and-drop">{_t('Add to workflow')}</h3>
        <hr />
        {nodebarNodes}
        <hr />
        <h4>{_t('My strategies')}</h4>
        <div className="strategy-bar-strategy-block">{strategies}</div>
        {/*{saltise_strategies.length > 0 && [*/}
        {/*  <h4>{_t('SALTISE strategies')}</h4>,*/}
        {/*  <div className="strategy-bar-strategy-block">*/}
        {/*    {saltise_strategies}*/}
        {/*  </div>*/}
        {/*]}*/}
      </div>
    )
  }
}

const mapStateToProps = (state: AppState): ConnectedProps => ({
  data: state.workflow,
  columns: state.column,
  availableStrategies: state.strategy
  // saltise_strategies: state.saltiseStrategy
})

const NodeBar = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(NodeBarUnconnected)

export default NodeBar
