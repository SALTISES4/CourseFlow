// @ts-nocheck
import * as React from 'react'
import { connect } from 'react-redux'
import NodeBarColumnWorkflow from '@cfCommonComponents/rightSideBarContent/NodeBar/components/NodeBarColumnWorkflow'
import Strategy from '@cfCommonComponents/rightSideBarContent/NodeBar/components/Strategy'
import { AppState } from '@cfRedux/type'

/**
 * The component for the right sidebar's tab in which
 * nodes and strategies can be dragged and added into the workflow
 */

type OwnPropsType = {
  renderer: any
  columnChoices: number[]
  readOnly: boolean
}
type ReduxProps = {
  data: AppState['workflow']
  columns: AppState['columns']
  available_strategies: AppState['strategy']
  // saltise_strategies: AppState['saltise_strategy']
}

type PropsType = OwnPropsType & ReduxProps

class NodeBarUnconnected extends React.Component<PropsType> {
  private columnChoices: number[]
  private readOnly: boolean
  constructor(props: PropsType) {
    super(props)
    this.columnChoices = this.props.columnChoices
    this.readOnly = this.props.readOnly
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let nodebar_nodes = []

    const nodebarColumnWorkflows = data.columnworkflow_set.map(
      (columnWorkflow: number, index: number) => (
        <NodeBarColumnWorkflow
          key={`NodeBarColumnWorkflow-${index}`}
          objectID={columnWorkflow}
          columnChoices={this.columnChoices}
        />
      )
    )
    const columns_present = this.props.columns.map((col) => col.column_type)

    for (let i = 0; i < data.DEFAULT_COLUMNS.length; i++) {
      if (columns_present.indexOf(data.DEFAULT_COLUMNS[i]) < 0) {
        nodebarColumnWorkflows.push(
          <NodeBarColumnWorkflow
            // renderer={this.props.renderer}
            columnType={data.DEFAULT_COLUMNS[i]}
            columnChoices={this.columnChoices}
          />
        )
      }
    }

    let i // @todo i not defined
    nodebarColumnWorkflows.push(
      <NodeBarColumnWorkflow
        // @ts-ignore
        key={`NodeBarColumnWorkflow-last-${i}`}
        // renderer={this.props.renderer}
        columnType={data.DEFAULT_CUSTOM_COLUMN}
        columnChoices={this.columnChoices}
      />
    )

    if (!this.readOnly) {
      nodebar_nodes = [
        <h4>{window.gettext('Nodes')}</h4>,
        <div className="node-bar-column-block">{nodebarColumnWorkflows}</div>
      ]
    }
    const strategies = this.props.available_strategies.map((strategy) => (
      <Strategy key={strategy.id} objectID={strategy.id} data={strategy} />
    ))
    // const saltise_strategies = this.props.saltise_strategies.map((strategy) => (
    //   <Strategy key={strategy.id} objectID={strategy.id} data={strategy} />
    // ))

    return (
      <div id="node-bar-workflow" className="right-panel-inner">
        <h3 className="drag-and-drop">{window.gettext('Add to workflow')}</h3>
        <hr />
        {nodebar_nodes}
        <hr />
        <h4>{window.gettext('My strategies')}</h4>
        <div className="strategy-bar-strategy-block">{strategies}</div>
        {/*{saltise_strategies.length > 0 && [*/}
        {/*  <h4>{window.gettext('SALTISE strategies')}</h4>,*/}
        {/*  <div className="strategy-bar-strategy-block">*/}
        {/*    {saltise_strategies}*/}
        {/*  </div>*/}
        {/*]}*/}
      </div>
    )
  }
}

const mapNodeBarStateToProps = (state: AppState): ReduxProps => ({
  data: state.workflow,
  columns: state.column,
  available_strategies: state.strategy,
  // saltise_strategies: state.saltise_strategy
})
export default connect(mapNodeBarStateToProps, null)(NodeBarUnconnected)
