
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
export const getStrategyByID = (state,id)=>{
    for(var i in state.strategy){
        var strategy = state.strategy[i];
        if(strategy.id==id)return {data:strategy,column_order:state.workflow.columnworkflow_set,sibling_count:state.workflow.strategyworkflow_set.length,nodestrategies:state.nodestrategy};
    }
}
export const getTermByID = (state,id)=>{
    for(var i in state.strategy){
        var strategy = state.strategy[i];
        if(strategy.id==id){
            var nodestrategies = strategy.nodestrategy_set;
            var nodes_by_column = {};
            for(var j=0;j<state.workflow.columnworkflow_set.length;j++){
                nodes_by_column[state.workflow.columnworkflow_set[j]]=[];
            }
            for(var j=0;j<nodestrategies.length;j++){
                let node_strategy = getNodeStrategyByID(state,nodestrategies[j]).data;
                let node = getNodeByID(state,node_strategy.node).data;
                nodes_by_column[node.columnworkflow].push(nodestrategies[j]);
            }
            return {data:strategy,column_order:state.workflow.columnworkflow_set,nodes_by_column:nodes_by_column,nodestrategies:state.nodestrategy};
        }
    }
}
export const getStrategyWorkflowByID = (state,id)=>{
    for(var i in state.strategyworkflow){
        var strategyworkflow = state.strategyworkflow[i];
        if(strategyworkflow.id==id)return {data:strategyworkflow,order:state.workflow.strategyworkflow_set};
    }
}
export const getNodeByID = (state,id)=>{
    for(var i in state.node){
        var node = state.node[i];
        if(node.id==id)return {data:node,column_order:state.workflow.columnworkflow_set};
    }
}
export const getNodeStrategyByID = (state,id)=>{
    for(var i in state.nodestrategy){
        var nodestrategy = state.nodestrategy[i];
        if(nodestrategy.id==id)return {data:nodestrategy,order:getStrategyByID(state,nodestrategy.strategy).nodestrategy_set};
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
    console.log("didn't find an outcomenode");
    console.log(state);
    console.log(id);
}