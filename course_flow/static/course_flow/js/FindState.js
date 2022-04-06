
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
        if(nodeweek.id==id)return {data:nodeweek,order:getWeekByID(state,nodeweek.week).nodeweek_set};
    }
}
export const getNodeLinkByID = (state,id)=>{
    for(var i in state.nodelink){
        var nodelink = state.nodelink[i];
        if(nodelink.id==id)return {data:nodelink};
    }
}
//Find the root outcome, and as we go, create pairs of parent outcome ids / throughmodel ids. These can later be pieced together in an iteration over the outcomes to create a list of ranks.
function findRootOutcome(id,rank,state){
    for(let i=0;i<state.length;i++){
        if(state[i].child==id){
            rank.unshift({parent:state[i].parent,through:state[i].id});
            return findRootOutcome(state[i].parent,rank,state);
        }
    }
    return {id:id,rank:rank};
}
function findTopRank(state,outcome,get_alternate){
    if(!get_alternate)for(let j=0;j<state.outcomeworkflow.length;j++){
        if(state.outcomeworkflow[j].outcome==outcome.id){
            return state.workflow.outcomeworkflow_set.indexOf(state.outcomeworkflow[j].id)+1;
        }
    }
    else if(get_alternate=="child")for(let j=0;j<state.child_outcomeworkflow.length;j++){
        if(state.child_outcomeworkflow[j].outcome==outcome.id){
            for(let k=0;k<state.child_workflow.length;k++){
                let index = state.child_workflow[k].outcomeworkflow_set.indexOf(state.child_outcomeworkflow[j].id);
                if(index>=0){
                    return index+1;
                }
            }
        }
    }
    else if(get_alternate=="parent")for(let j=0;j<state.parent_outcomeworkflow.length;j++){
        if(state.parent_outcomeworkflow[j].outcome==outcome.id){
            for(let k=0;k<state.parent_workflow.length;k++){
                let index = state.parent_workflow[k].outcomeworkflow_set.indexOf(state.parent_outcomeworkflow[j].id);
                if(index>=0){
                    return index+1;
                }
            }
        }
    }
}
export const getOutcomeByID = (state,id,get_alternate,display_parent_outcomes)=>{
    let state_section;
    if(get_alternate=="child")state_section=state.child_outcome;
    else if(get_alternate=="parent")state_section=state.parent_outcome;
    else state_section=state.outcome;
    for(var i in state_section){
        var outcome = state_section[i];
        
        if(outcome.id==id){
            let root_outcome;
            let rank=[];
            let titles=[];
            let top_rank;
            if(outcome.depth>0){
                let state_outcomeoutcome_section;
                if(get_alternate=="child")state_outcomeoutcome_section=state.child_outcomeoutcome;
                else if(get_alternate=="parent")state_outcomeoutcome_section=state.parent_outcomeoutcome;
                else state_outcomeoutcome_section=state.outcomeoutcome;
                let root_info = findRootOutcome(outcome.id,[],state_outcomeoutcome_section);
                rank = root_info.rank.map(x=>null);
                titles = rank.map(x=>null);
                for(let j=0;j<state_section.length;j++){
                    if(state_section[j].id==root_info.id)root_outcome=state_section[j];
                    for(let k=0;k<root_info.rank.length;k++){
                        if(root_info.rank[k].parent==state_section[j].id){
                            titles[k]=state_section[j].title;
                            if(rank[k])continue;
                            if(state_section[j].code){
                                if(k>0)rank[k-1]=state_section[j].code;
                                else top_rank=state_section[j].code;
                            }
                            rank[k]=state_section[j].child_outcome_links.indexOf(root_info.rank[k].through)+1;
                        }
                    }
                }
            }else{
                root_outcome=outcome;
                if(outcome.code)top_rank=outcome.code;
            }
            if(!top_rank)top_rank = findTopRank(state,root_outcome,get_alternate);
            titles.push(outcome.title);
            rank.unshift(top_rank);
            if(display_parent_outcomes)return {data:outcome,parent_outcomes:state.parent_outcomes,outcomenodes:state.outcomenode,rank:rank,titles:titles};
            else return {data:outcome,outcomenodes:state.outcomenode,rank:rank,titles:titles};
        }
    }
    console.log("failed to find outcome");
}
export const getChildWorkflowByID = (state,id)=>{
    for(var i in state.child_workflow){
        var workflow = state.child_workflow[i];
        if(workflow.id==id)return {data:workflow};
    }
}
export const getChildOutcomeWorkflowByID = (state,id)=>{
    for(var i in state.child_outcomeworkflow){
        var outcomeworkflow = state.child_outcomeworkflow[i];
        if(outcomeworkflow.id==id)return {data:outcomeworkflow};
    }
}
export const getOutcomeOutcomeByID = (state,id,get_alternate)=>{
    let state_section;
    if(get_alternate=="child")state_section=state.child_outcomeoutcome;
    else if(get_alternate=="parent")state_section=state.parent_outcomeoutcome;
    else state_section=state.outcomeoutcome;
    for(var i in state_section){
        var outcomeoutcome = state_section[i];
        if(outcomeoutcome.id==id)return {data:outcomeoutcome};
    }
    console.log("failed to find outcomeoutcome");
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