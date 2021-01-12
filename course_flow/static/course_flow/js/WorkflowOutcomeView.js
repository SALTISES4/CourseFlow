import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON} from "./ComponentJSON.js";


//Represents the entire outcomeview, barring top level workflow stuff
class WorkflowOutcomeView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="workflow";
    }
    
    render(){
        console.log("RENDERING OUTCOME VIEW");
        console.log(this.props.data);
        
        let colgroups = this.props.data.map((nodecategory)=>
            <colgroup>
                {nodecategory.nodes.map((node)=>
                    <col/>
                )}
            </colgroup>
        )
        
        let headers = this.props.data.map((nodecategory)=>
            <th colspan={nodecategory.nodes.length}>
                <div class="nodecategory-header">
                    {nodecategory.title}
                </div>
            </th>
        );
        let nodes = this.props.data.map((nodecategory)=>
            nodecategory.nodes.map((node)=>
                <th>
                    {node}
                </th>
            )
        );
        
        
        return(
            <table>
            <thead>
                {colgroups}
                <tr>{headers}</tr>
                <tr>{nodes}</tr>
            </thead>
            
            </table>
        );
    }
    
}
function pushOrCreate(obj,index,value){
    if(obj[index])obj[index].push(value);
    else obj[index]=[value];
}
const mapStateToProps = (state,own_props)=>{
    let props={};
    let strategyworkflow_order = state.workflow.strategyworkflow_set;
    let strategy_order = state.strategyworkflow.slice().sort(function(a,b){return(strategyworkflow_order.indexOf(a.id)-strategyworkflow_order.indexOf(b.id))}).map((strategyworkflow)=>strategyworkflow.strategy);
    let strategies_ordered = state.strategy.slice().sort(function(a,b){return strategy_order.indexOf(a.id)-strategy_order.indexOf(b.id)})
        
    let nodestrategy_order=[].concat(...strategies_ordered.map((strategy)=>strategy.nodestrategy_set));
    console.log(nodestrategy_order);
    let nodestrategies_ordered = state.nodestrategy.slice().sort(function(a,b){return nodestrategy_order.indexOf(a.id)-nodestrategy_order.indexOf(b.id)});
    let node_order = nodestrategies_ordered.map((nodestrategy)=>nodestrategy.node);
    let nodes_ordered = state.node.slice().sort(function(a,b){return node_order.indexOf(a.id)-node_order.indexOf(b.id)});
    console.log(node_order);
    switch(own_props.outcome_sort){
        case 0:
            let nodes_by_strategy={};
            for(let i=0;i<nodestrategies_ordered.length;i++){
                let nodestrategy = nodestrategies_ordered[i];
                pushOrCreate(nodes_by_strategy,nodestrategy.strategy,nodestrategy.node);
            }
            return {data:strategies_ordered.map((strategy)=>{return {title:strategy.title,nodes:nodes_by_strategy[strategy.id]};})};
        case 1:
            let columnworkflow_order = state.workflow.columnworkflow_set;
            let column_order = state.columnworkflow.slice().sort(function(a,b){return(columnworkflow_order.indexOf(a.id)-columnworkflow_order.indexOf(b.id))}).map((columnworkflow)=>columnworkflow.strategy);
            let columns_ordered = state.column.slice().sort(function(a,b){return(column_order.indexOf(a.id)-column_order.indexOf(b.id))});
            let nodes_by_column={};
            for(let i=0;i<nodes_ordered.length;i++){
                let node = nodes_ordered[i];
                pushOrCreate(nodes_by_column,node.column,node.id);
            }
            return {data:columns_ordered.map((column)=>{return {title:column.title,nodes:nodes_by_column[column.id]};})};
    }
}
const mapDispatchToProps = {};
export default connect(
    mapStateToProps,
    null
)(WorkflowOutcomeView)