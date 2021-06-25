
export const getColumnByID = (state,id)=>{
    for(var i in state.column){
        var column = state.column[i];
        if(column.id==id)return {
            data:column,
            sibling_count:state.workflow.columnworkflow_set.length,
            columnworkflows:state.workflow.columnworkflow_set,
            column_order:state.columnworkflow.sort(
                (a,b)=>state.workflow.columnworkflow_set.indexOf(a.id) - state.workflow.columnworkflow_set.indexOf(b.id)
            ).map(columnworkflow=>columnworkflow.column),
        };
    }
}
export const getColumnWorkflowByID = (state,id)=>{
    for(var i in state.columnworkflow){
        var columnworkflow = state.columnworkflow[i];
        if(columnworkflow.id==id)return {data:columnworkflow,order:state.workflow.columnworkflow_set};
    }
}
export const getWeekByID = (state,id)=>{
    for(var i in state.week){
        var week = state.week[i];
        if(week.id==id)return {
            data:week,
            column_order:state.columnworkflow.sort(
                (a,b)=>state.workflow.columnworkflow_set.indexOf(a.id) - state.workflow.columnworkflow_set.indexOf(b.id)
            ).map(columnworkflow=>columnworkflow.column),
            sibling_count:state.workflow.weekworkflow_set.length,
            nodeweeks:state.nodeweek
        };
    }
}
export const getTermByID = (state,id)=>{
    for(var i in state.week){
        var week = state.week[i];
        if(week.id==id){
            var nodeweeks = week.nodeweek_set;
            var column_order = state.columnworkflow.sort(
                (a,b)=>state.workflow.columnworkflow_set.indexOf(a.id) - state.workflow.columnworkflow_set.indexOf(b.id)
            ).map(columnworkflow=>columnworkflow.column);
            var nodes_by_column = {};
            for(var j=0;j<column_order.length;j++){
                nodes_by_column[column_order[j]]=[];
            }
            for(var j=0;j<nodeweeks.length;j++){
                let node_week = getNodeWeekByID(state,nodeweeks[j]).data;
                let node = getNodeByID(state,node_week.node).data;
                nodes_by_column[node.column].push(nodeweeks[j]);
            }
            return {
                data:week,
                column_order:column_order,
                nodes_by_column:nodes_by_column,
                nodeweeks:state.nodeweek
            };
        }
    }
}
export const getWeekWorkflowByID = (state,id)=>{
    for(var i in state.weekworkflow){
        var weekworkflow = state.weekworkflow[i];
        if(weekworkflow.id==id)return {data:weekworkflow,order:state.workflow.weekworkflow_set};
    }
}
export const getOutcomeWorkflowByID = (state,id)=>{
    for(var i in state.outcomeworkflow){
        var outcomeworkflow = state.outcomeworkflow[i];
        if(outcomeworkflow.id==id)return {data:outcomeworkflow,order:state.workflow.outcomeworkflow_set};
    }
}
export const getParentOutcomeWorkflowByID = (state,id)=>{
    for(var i in state.parent_outcomeworkflow){
        var outcomeworkflow = state.parent_outcomeworkflow[i];
        if(outcomeworkflow.id==id)return {data:outcomeworkflow,order:state.workflow.outcomeworkflow_set};
    }
}
export const getParentWorkflowByID = (state,id)=>{
    console.log(id);
    console.log(state);
    for(var i in state.parent_workflow){
        var workflow = state.parent_workflow[i];
        if(workflow.id==id)return {data:workflow}
    }
}
export const getNodeByID = (state,id)=>{
    for(var i in state.node){
        var node = state.node[i];
        if(node.id==id)return {data:node};
    }
}
export const getNodeWeekByID = (state,id)=>{
    for(var i in state.nodeweek){
        var nodeweek = state.nodeweek[i];
        console.log(nodeweek.id);
        console.log(nodeweek.week);
        console.log(state);
        if(nodeweek.id==id)return {data:nodeweek,order:getWeekByID(state,nodeweek.week).nodeweek_set};
    }
}
export const getNodeLinkByID = (state,id)=>{
    for(var i in state.nodelink){
        var nodelink = state.nodelink[i];
        if(nodelink.id==id)return {data:nodelink};
    }
}
export const getOutcomeByID = (state,id,display_parent_outcomes)=>{
    console.log("looking for outcome with id "+id);
    for(var i in state.outcome){
        var outcome = state.outcome[i];
        if(outcome.id==id){
            if(display_parent_outcomes)return {data:outcome,parent_outcomes:state.parent_outcomes,outcomenodes:state.outcomenode};
            else return {data:outcome,outcomenodes:state.outcomenode};
        }
    }
}
export const getParentOutcomeByID = (state,id)=>{
    console.log("looking for outcome with id "+id);
    for(var i in state.parent_outcome){
        var outcome = state.parent_outcome[i];
        if(outcome.id==id)return {data:outcome};
    }
}
export const getOutcomeOutcomeByID = (state,id)=>{
    for(var i in state.outcomeoutcome){
        var outcomeoutcome = state.outcomeoutcome[i];
        if(outcomeoutcome.id==id)return {data:outcomeoutcome};
    }
}
export const getParentOutcomeOutcomeByID = (state,id)=>{
    for(var i in state.parent_outcomeoutcome){
        var outcomeoutcome = state.parent_outcomeoutcome[i];
        if(outcomeoutcome.id==id)return {data:outcomeoutcome};
    }
}
export const getOutcomeNodeByID = (state,id)=>{
    for(var i in state.outcomenode){
        var outcomenode = state.outcomenode[i];
        if(outcomenode.id==id)return {data:outcomenode};
    }
}
export const getOutcomeHorizontalLinkByID = (state,id)=>{
    for(var i in state.outcomehorizontallink){
        var outcomehorizontallink = state.outcomehorizontallink[i];
        if(outcomehorizontallink.id==id)return {data:outcomehorizontallink};
    }
}
export const getParentOutcomeNodeByID = (state,id)=>{
    for(var i in state.parent_outcomenode){
        var outcomenode = state.parent_outcomenode[i];
        if(outcomenode.id==id)return {data:outcomenode};
    }
}
export const getTableOutcomeNodeByID = (state,node_id, outcome_id)=>{
    for(var i in state.outcomenode){
        var outcomenode = state.outcomenode[i];
        if(outcomenode.outcome==outcome_id && outcomenode.node==node_id)return {data:outcomenode};
    }
    return {data:null}
}
export const getStrategyByID = (state,id)=>{
    for(var i in state.strategy){
        var strategy = state.strategy[i];
        if(strategy.id==id)return {data:strategy};
    }
}