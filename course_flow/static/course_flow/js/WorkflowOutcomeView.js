import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {NodeOutcomeView} from "./NodeView";
import {TableOutcomeView} from "./OutcomeView";
import {TableOutcomeWorkflowView} from "./OutcomeWorkflowView"
import {pushOrCreate, filterThenSortByID, checkSetHidden} from "./Constants"
import {TableChildWorkflowHeader} from "./OutcomeHorizontalLink";
import {getSortedOutcomesFromOutcomeWorkflowSet} from "./FindState";


//Represents the entire outcomeview, barring top level workflow stuff
class WorkflowOutcomeView extends React.Component{
    constructor(props){
        super(props);
        this.objectType="workflow";
    }
    
    render(){
        
        let has_nodes=false;
        for(let i=0;i<this.props.data.length;i++){
            if(this.props.data[i].nodes.length>0){has_nodes=true;break;}
        }
        
        if(this.props.outcomes_sorted.length==0 || !has_nodes){
            let text;
            if(this.props.renderer.view_type=="outcometable")text=gettext("This view renders a table showing the relationships between nodes and outcomes. Add outcomes and nodes to the workflow to get started.");
            else text = gettext("This view renders a table showing the relationships between this workflow's outcomes and the outcomes of their linked workflows. To use this feature, you must link the nodes in this workflow to child workflows (ex. program nodes to course workflows) and ensure that those child workflows have their own sets of outcomes.");
            return(
                <div class="emptytext">
                    {text}
                </div>
            );
        }else{
            let nodes;
            if(this.props.renderer.view_type=="outcometable")nodes = this.props.data.map((nodecategory)=>
                <div class="table-group">
                    <div class="table-cell nodewrapper blank-cell"><div class="node-category-header">{nodecategory.title}</div></div>
                    {nodecategory.nodes.map((node)=>
                        <div class="table-cell nodewrapper">
                            <NodeOutcomeView renderer={this.props.renderer} objectID={node}/>
                        </div>
                    )}
                    <div class="table-cell nodewrapper total-cell"><div class="total-header">Total</div></div>
                </div>
            );
            else nodes = nodes = this.props.data.map((nodecategory)=>
                <div class="table-group">
                    <div class="table-cell nodewrapper blank-cell"><div class="node-category-header">{nodecategory.title}</div></div>
                    {nodecategory.nodes.map((node)=>
                        <TableChildWorkflowHeader renderer={this.props.renderer} nodeID={node}/>
                    )}
                    <div class="table-cell nodewrapper total-cell"><div class="total-header">Total</div></div>
                </div>
            );
            let outcomes = this.props.outcomes_sorted.map((category)=>
                <div>
                    {this.props.object_sets.length>0 &&
                        <div class="outcome-row outcome-category">
                            <div class="outcome-head"><h4>{category.objectset.title}</h4></div>
                        </div>
                    }
                {category.outcomes.map(outcome=>
                    <TableOutcomeView renderer={this.props.renderer} objectID={outcome.id} nodecategory={this.props.data} outcomes_type={this.props.outcomes_type}/>
                )}</div>                                       
            );

            return(
                <div class="outcome-table node-rows">
                    <div class="outcome-row node-row"><div class="outcome-head empty"></div><div class="outcome-cells">{nodes}</div>
                    <div class="table-cell blank-cell"><div class="node-category-header"></div></div><div class="table-cell total-cell grand-total-cell"><div class="total-header">Grand Total</div></div></div>
                    {outcomes}
                </div>
            );
        }
    }
    
}
const mapStateToProps = (state,own_props)=>{
    let week_order = filterThenSortByID(state.weekworkflow,state.workflow.weekworkflow_set).map(weekworkflow=>weekworkflow.week);
    let weeks_ordered = filterThenSortByID(state.week,week_order);
    let nodeweek_order = [].concat(...weeks_ordered.map((week)=>week.nodeweek_set));
    let nodeweeks_ordered = filterThenSortByID(state.nodeweek,nodeweek_order)
    let node_order = nodeweeks_ordered.map(nodeweek=>nodeweek.node);
    let object_sets = state.objectset;
    let nodes_ordered = filterThenSortByID(state.node,node_order).filter(node=>!checkSetHidden(node,object_sets));
    
    let outcomes_sorted = getSortedOutcomesFromOutcomeWorkflowSet(state,state.workflow.outcomeworkflow_set);
    
    
    switch(parseInt(state.workflow.outcomes_sort)){
        case 0:
            let nodes_allowed = nodes_ordered.map(node=>node.id);
            nodeweeks_ordered = nodeweeks_ordered.filter(nodeweek=>nodes_allowed.indexOf(nodeweek.node)>=0);
            let nodes_by_week={};
            for(let i=0;i<nodeweeks_ordered.length;i++){
                let nodeweek = nodeweeks_ordered[i];
                pushOrCreate(nodes_by_week,nodeweek.week,nodeweek.node);
            }
            return {data:weeks_ordered.map((week,index)=>{return {title:(week.title||week.week_type_display+" "+(index+1)),nodes:(nodes_by_week[week.id]||[])};}),outcomes_sorted:outcomes_sorted,object_sets:state.objectset};
        case 1:
            let column_order = filterThenSortByID(state.columnworkflow,state.workflow.columnworkflow_set).map(columnworkflow=>columnworkflow.column);
            let columns_ordered = filterThenSortByID(state.column,column_order);
            let nodes_by_column={};
            for(let i=0;i<nodes_ordered.length;i++){
                let node = nodes_ordered[i];
                pushOrCreate(nodes_by_column,node.column,node.id);
            }
            return {data:columns_ordered.map((column,index)=>{return {title:(column.title||column.column_type_display),nodes:(nodes_by_column[column_order[index]]||[])};}),outcomes_sorted:outcomes_sorted,object_sets:state.objectset};
        case 2:
            var workflow_type = ["activity","course","program"].indexOf(state.workflow.type)
            let task_ordered = own_props.renderer.task_choices.filter((x)=> (x.type==0 || (x.type>100*workflow_type &&x.type<100*(workflow_type+1))));
            let nodes_by_task={};
            for(let i=0;i<nodes_ordered.length;i++){
                let node = nodes_ordered[i];
                pushOrCreate(nodes_by_task,node.task_classification,node.id);
            }
            return {data:task_ordered.map((task)=>{return {title:task.name,nodes:(nodes_by_task[task.type]||[])};}),outcomes_sorted:outcomes_sorted,object_sets:state.objectset};
        case 3:
            var workflow_type = ["activity","course","program"].indexOf(state.workflow.type)
            let context_ordered = own_props.renderer.context_choices.filter((x)=> (x.type==0 || (x.type>100*workflow_type &&x.type<100*(workflow_type+1))));
            let nodes_by_context={};
            for(let i=0;i<nodes_ordered.length;i++){
                let node = nodes_ordered[i];
                pushOrCreate(nodes_by_context,node.context_classification,node.id);
            }
            return {data:context_ordered.map((context)=>{return {title:context.name,nodes:(nodes_by_context[context.type]||[])};}),outcomes_sorted:outcomes_sorted,object_sets:state.objectset};
    }
}
const mapDispatchToProps = {};
export default connect(
    mapStateToProps,
    null
)(WorkflowOutcomeView)


