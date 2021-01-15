import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON} from "./ComponentJSON.js";
import {NodeOutcomeView} from "./NodeView.js";
import {TableOutcomeView} from "./OutcomeView.js";


//Represents the entire outcomeview, barring top level workflow stuff
class WorkflowOutcomeView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="workflow";
    }
    
    render(){
        
        let headers = [];
        for(let i=0;i<this.props.data.length;i++){
            for(let j=0;j<this.props.data[i].nodes.length+2;j++){
                if(j==0)headers.push(
                    <div class="node-category-header">
                    {this.props.data[i].title}
                    </div>
                );
                else headers.push(
                    <div class="node-category-header"></div>
                )
            }
        }
        let nodes = this.props.data.map((nodecategory)=>
            <div class="table-group">
                {nodecategory.nodes.map((node)=>
                    <div class="table-cell nodewrapper">
                        <NodeOutcomeView objectID={node} selection_manager={this.props.selection_manager}/>
                    </div>
                )}
                <div class="table-cell nodewrapper total-cell"><div class="total-header">Total</div></div>
                <div class="table-cell blank-cell"></div>
            </div>
        );
        
        let outcomes = this.props.outcomeproject.map((outcomeproject)=>
            <TableOutcomeView objectID={outcomeproject.outcome} nodecategory={this.props.data} outcomes_type={this.props.outcomes_type}/>                                          
        );
        
        
        return(
            <div class="outcome-table">
                <div class="outcome-row node-row"><div class="outcome-head"></div><div class="outcome-cells">{headers}</div></div>
                <div class="outcome-row node-row"><div class="outcome-head"></div><div class="outcome-cells">{nodes}</div><div class="table-cell total-cell grand-total-cell"><div class="total-header">Grand Total</div></div></div>
                {outcomes}
            </div>
        );
    }
    
}
function pushOrCreate(obj,index,value){
    if(obj[index])obj[index].push(value);
    else obj[index]=[value];
}
const mapStateToProps = (state,own_props)=>{
    let strategyworkflow_order = state.workflow.strategyworkflow_set;
    let strategy_order = state.strategyworkflow.slice().sort(function(a,b){return(strategyworkflow_order.indexOf(a.id)-strategyworkflow_order.indexOf(b.id))}).map((strategyworkflow)=>strategyworkflow.strategy);
    let strategies_ordered = state.strategy.slice().sort(function(a,b){return strategy_order.indexOf(a.id)-strategy_order.indexOf(b.id)})
        
    let nodestrategy_order=[].concat(...strategies_ordered.map((strategy)=>strategy.nodestrategy_set));
    console.log(nodestrategy_order);
    let nodestrategies_ordered = state.nodestrategy.slice().sort(function(a,b){return nodestrategy_order.indexOf(a.id)-nodestrategy_order.indexOf(b.id)});
    let node_order = nodestrategies_ordered.map((nodestrategy)=>nodestrategy.node);
    let nodes_ordered = state.node.slice().sort(function(a,b){return node_order.indexOf(a.id)-node_order.indexOf(b.id)});
    console.log(state.workflow.outcomes_sort);
    switch(parseInt(state.workflow.outcomes_sort)){
        case 0:
            let nodes_by_strategy={};
            for(let i=0;i<nodestrategies_ordered.length;i++){
                let nodestrategy = nodestrategies_ordered[i];
                pushOrCreate(nodes_by_strategy,nodestrategy.strategy,nodestrategy.node);
            }
            return {data:strategies_ordered.map((strategy)=>{return {title:strategy.title,nodes:nodes_by_strategy[strategy.id]};}),outcomeproject:state.outcomeproject};
        case 1:
            let columnworkflow_order = state.workflow.columnworkflow_set;
            let column_order = state.columnworkflow.slice().sort(function(a,b){return(columnworkflow_order.indexOf(a.id)-columnworkflow_order.indexOf(b.id))}).map((columnworkflow)=>columnworkflow.strategy);
            let columns_ordered = state.column.slice().sort(function(a,b){return(column_order.indexOf(a.id)-column_order.indexOf(b.id))});
            let nodes_by_column={};
            for(let i=0;i<nodes_ordered.length;i++){
                let node = nodes_ordered[i];
                pushOrCreate(nodes_by_column,node.column,node.id);
            }
            return {data:columns_ordered.map((column)=>{return {title:column.title,nodes:(nodes_by_column[column.id]||[])};}),outcomeproject:state.outcomeproject};
        case 2:
            var workflow_type = ["activity","course","program"].indexOf(state.workflow.type)
            let context_ordered = context_choices.filter((x)=> (x.type==0 || (x.type>100*workflow_type &&x.type<100*(workflow_type+1))));
            let nodes_by_context={};
            for(let i=0;i<nodes_ordered.length;i++){
                let node = nodes_ordered[i];
                pushOrCreate(nodes_by_context,node.context_classification,node.id);
            }
            console.log(context_ordered);
            console.log(nodes_by_context);
            console.log(context_ordered.map((context)=>{return {title:context.name,nodes:nodes_by_context[context.type]};}));
            return {data:context_ordered.map((context)=>{return {title:context.name,nodes:(nodes_by_context[context.type]||[])};}),outcomeproject:state.outcomeproject};
        case 3:
            var workflow_type = ["activity","course","program"].indexOf(state.workflow.type)
            let task_ordered = task_choices.filter((x)=> (x.type==0 || (x.type>100*workflow_type &&x.type<100*(workflow_type+1))));
            let nodes_by_task={};
            for(let i=0;i<nodes_ordered.length;i++){
                let node = nodes_ordered[i];
                pushOrCreate(nodes_by_task,node.task_classification,node.id);
            }
            console.log(task_ordered);
            console.log(nodes_by_task);
            console.log(task_ordered.map((task)=>{return {title:task.name,nodes:nodes_by_task[task.type]};}));
            return {data:task_ordered.map((task)=>{return {title:task.name,nodes:(nodes_by_task[task.type]||[])};}),outcomeproject:state.outcomeproject};
    }
}
const mapDispatchToProps = {};
export default connect(
    mapStateToProps,
    null
)(WorkflowOutcomeView)