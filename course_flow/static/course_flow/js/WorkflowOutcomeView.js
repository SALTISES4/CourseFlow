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
        /*for(let i=0;i<this.props.data.length;i++){
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
        }*/
        let nodes = this.props.data.map((nodecategory)=>
            <div class="table-group">
                <div class="table-cell nodewrapper blank-cell"><div class="node-category-header">{nodecategory.title}</div></div>
                {nodecategory.nodes.map((node)=>
                    <div class="table-cell nodewrapper">
                        <NodeOutcomeView objectID={node} selection_manager={this.props.selection_manager}/>
                    </div>
                )}
                <div class="table-cell nodewrapper total-cell"><div class="total-header">Total</div></div>
            </div>
        );
        
        let outcomes = this.props.outcomeproject.map((outcomeproject)=>
            <TableOutcomeView objectID={outcomeproject.outcome} nodecategory={this.props.data} outcomes_type={this.props.outcomes_type}/>                                          
        );
        
        
        return(
            <div class="outcome-table">
                <div class="outcome-row node-row"><div class="outcome-head"></div><div class="outcome-cells">{headers}</div></div>
                <div class="outcome-row node-row"><div class="outcome-head"></div><div class="outcome-cells">{nodes}</div>
                <div class="table-cell blank-cell"><div class="total-header"></div></div><div class="table-cell total-cell grand-total-cell"><div class="total-header">Grand Total</div></div></div>
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
    let weekworkflow_order = state.workflow.weekworkflow_set;
    let week_order = state.weekworkflow.slice().sort(function(a,b){return(weekworkflow_order.indexOf(a.id)-weekworkflow_order.indexOf(b.id))}).map((weekworkflow)=>weekworkflow.week);
    let weeks_ordered = state.week.slice().sort(function(a,b){return week_order.indexOf(a.id)-week_order.indexOf(b.id)})
        
    let nodeweek_order=[].concat(...weeks_ordered.map((week)=>week.nodeweek_set));
    console.log(nodeweek_order);
    let nodeweeks_ordered = state.nodeweek.slice().sort(function(a,b){return nodeweek_order.indexOf(a.id)-nodeweek_order.indexOf(b.id)});
    let node_order = nodeweeks_ordered.map((nodeweek)=>nodeweek.node);
    let nodes_ordered = state.node.slice().sort(function(a,b){return node_order.indexOf(a.id)-node_order.indexOf(b.id)});
    console.log(state.workflow.outcomes_sort);
    switch(parseInt(state.workflow.outcomes_sort)){
        case 0:
            let nodes_by_week={};
            for(let i=0;i<nodeweeks_ordered.length;i++){
                let nodeweek = nodeweeks_ordered[i];
                pushOrCreate(nodes_by_week,nodeweek.week,nodeweek.node);
            }
            return {data:weeks_ordered.map((week,index)=>{return {title:(week.title||week.week_type_display+" "+(index+1)),nodes:nodes_by_week[week.id]};}),outcomeproject:state.outcomeproject};
        case 1:
            let columnworkflow_order = state.workflow.columnworkflow_set;
            let column_order = state.columnworkflow.slice().sort(function(a,b){return(columnworkflow_order.indexOf(a.id)-columnworkflow_order.indexOf(b.id))}).map((columnworkflow)=>columnworkflow.week);
            let columns_ordered = state.column.slice().sort(function(a,b){return(column_order.indexOf(a.id)-column_order.indexOf(b.id))});
            let nodes_by_column={};
            for(let i=0;i<nodes_ordered.length;i++){
                let node = nodes_ordered[i];
                pushOrCreate(nodes_by_column,node.columnworkflow,node.id);
            }
            return {data:columns_ordered.map((column,index)=>{return {title:(column.title||column.column_type_display),nodes:(nodes_by_column[columnworkflow_order[index]]||[])};}),outcomeproject:state.outcomeproject};
        case 2:
            var workflow_type = ["activity","course","program"].indexOf(state.workflow.type)
            let context_ordered = context_choices.filter((x)=> (x.type==0 || (x.type>100*workflow_type &&x.type<100*(workflow_type+1))));
            let nodes_by_context={};
            for(let i=0;i<nodes_ordered.length;i++){
                let node = nodes_ordered[i];
                pushOrCreate(nodes_by_context,node.context_classification,node.id);
            }
            return {data:context_ordered.map((context)=>{return {title:context.name,nodes:(nodes_by_context[context.type]||[])};}),outcomeproject:state.outcomeproject};
        case 3:
            var workflow_type = ["activity","course","program"].indexOf(state.workflow.type)
            let task_ordered = task_choices.filter((x)=> (x.type==0 || (x.type>100*workflow_type &&x.type<100*(workflow_type+1))));
            let nodes_by_task={};
            for(let i=0;i<nodes_ordered.length;i++){
                let node = nodes_ordered[i];
                pushOrCreate(nodes_by_task,node.task_classification,node.id);
            }
            return {data:task_ordered.map((task)=>{return {title:task.name,nodes:(nodes_by_task[task.type]||[])};}),outcomeproject:state.outcomeproject};
    }
}
const mapDispatchToProps = {};
export default connect(
    mapStateToProps,
    null
)(WorkflowOutcomeView)