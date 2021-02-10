
export const getColumnByID = (state,id)=>{
    for(var i in state.column){
        var column = state.column[i];
        if(column.id==id)return {data:column,sibling_count:state.workflow.columnworkflow_set.length,columnworkflows:state.workflow.columnworkflow_set};
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
            var nodes_by_column = {};
            for(var j=0;j<state.workflow.columnworkflow_set.length;j++){
                nodes_by_column[state.workflow.columnworkflow_set[j]]=[];
            }
            for(var j=0;j<nodeweeks.length;j++){
                let node_week = getNodeWeekByID(state,nodeweeks[j]).data;
                let node = getNodeByID(state,node_week.node).data;
                nodes_by_column[node.columnworkflow].push(nodeweeks[j]);
            }
            return {
                data:week,
                column_order:state.columnworkflow.sort(
                    (a,b)=>state.workflow.columnworkflow_set.indexOf(a.id) - state.workflow.columnworkflow_set.indexOf(b.id)
                ).map(columnworkflow=>columnworkflow.column),
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
export const getNodeByID = (state,id)=>{
    for(var i in state.node){
        var node = state.node[i];
        if(node.id==id)return {data:node};
    }
}
export const getNodeWeekByID = (state,id)=>{
    for(var i in state.nodeweek){
        var nodeweek = state.nodeweek[i];
        if(nodeweek.id==id)return {data:nodeweek,order:getWeekByID(state,nodeweek.week).nodeweek_set};
    }
}
export const getNodeLinkByID = (state,id)=>{
    for(var i in state.nodelink){
        var nodelink = state.nodelink[i];
        if(nodelink.id==id)return {data:nodelink};
    }
}
export const getOutcomeByID = (state,id)=>{
    for(var i in state.outcome){
        var outcome = state.outcome[i];
        if(outcome.id==id)return {data:outcome};
    }
}
export const getOutcomeOutcomeByID = (state,id)=>{
    for(var i in state.outcomeoutcome){
        var outcomeoutcome = state.outcomeoutcome[i];
        if(outcomeoutcome.id==id)return {data:outcomeoutcome};
    }
}
export const getOutcomeNodeByID = (state,id)=>{
    for(var i in state.outcomenode){
        var outcomenode = state.outcomenode[i];
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