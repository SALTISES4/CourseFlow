import * as Constants from "./Constants.js";
import {unlinkOutcomeFromNode, deleteSelf, insertedAt, columnChanged, updateValue, updateOutcomenodeDegree} from "./PostFunctions.js"

export const moveColumnWorkflow = (id,new_position) => {
    return {
        type: 'columnworkflow/movedTo',
        payload:{id:id,new_index:new_position}
    }
}

export const moveWeekWorkflow = (id,new_position) => {
    return {
        type: 'weekworkflow/movedTo',
        payload:{id:id,new_index:new_position}
    }
}

export const deleteSelfAction = (id,parentID,objectType,extra_data) => {
    return {
        type: objectType+"/deleteSelf",
        payload:{id:id,parent_id:parentID,extra_data:extra_data}
    }
}

export const insertBelowAction = (response_data,objectType) => {
    return {
        type: objectType+"/insertBelow",
        payload:response_data
    }
}

export const insertChildAction = (response_data,objectType) => {
    return {
        type: objectType+"/insertChild",
        payload:response_data
    }
}

export const setLinkedWorkflowAction = (response_data) => {
    return {
        type: "node/setLinkedWorkflow",
        payload:response_data
    }
}

export const newNodeAction = (response_data) => {
    return {
        type: "node/newNode",
        payload:response_data
    }
}

export const columnChangeNodeWeek = (id,delta_x,columns) => {
    return {
        type: 'node/movedColumnBy',
        payload:{id:id,delta_x,columns:columns}
    }
}

export const moveNodeWeek = (id,new_position,new_parent,nodes_by_column) => {
    return {
        type: 'nodeweek/movedTo',
        payload:{id:id,new_index:new_position,new_parent:new_parent,nodes_by_column:nodes_by_column}
    }
}

export const newNodeLinkAction = (response_data) => {
    return {
        type: 'nodelink/newNodeLink',
        payload:response_data
    }
}

export const changeField = (id,objectType,field,value) => {
    return {
        type: objectType+'/changeField',
        payload:{id:id,field:field,value:value}
    }
}

export const moveOutcomeOutcome = (id,new_position,new_parent) => {
    return {
        type: 'outcomeoutcome/movedTo',
        payload:{id:id,new_index:new_position,new_parent:new_parent}
    }
}

export const addOutcomeToNodeAction = (response_data) => {
    return {
        type: "outcome/addToNode",
        payload:response_data
    }
}

export const newStrategyAction = (response_data) => {
    return {
        type: "strategy/addStrategy",
        payload:response_data
    }
}
export const toggleStrategyAction = (response_data) => {
    return {
        type: "strategy/toggleStrategy",
        payload:response_data
    }
}
export const homeMenuItemAdded = (response_data) => {
    return {
        type: "homemenu/itemAdded",
        payload:response_data
    }
}


export function workflowReducer(state={},action){
    switch(action.type){
        case 'columnworkflow/movedTo':
            var new_columnworkflow_set = state.columnworkflow_set.slice();
            for(var i=0;i<new_columnworkflow_set.length;i++){
                if(new_columnworkflow_set[i]==action.payload.id){
                    new_columnworkflow_set.splice(action.payload.new_index,0,new_columnworkflow_set.splice(i,1)[0]);
                    break;
                }
            }
            insertedAt(action.payload.id,"columnworkflow",state.id,action.payload.new_index);
            return {
                ...state,
                columnworkflow_set:new_columnworkflow_set
            }
        case 'weekworkflow/movedTo':
            var new_weekworkflow_set = state.weekworkflow_set.slice();
            for(var i=0;i<new_weekworkflow_set.length;i++){
                if(new_weekworkflow_set[i]==action.payload.id){
                    new_weekworkflow_set.splice(action.payload.new_index,0,new_weekworkflow_set.splice(i,1)[0]);
                    break;
                }
            }
            insertedAt(action.payload.id,"weekworkflow",state.id,action.payload.new_index);
            return {
                ...state,
                weekworkflow_set:new_weekworkflow_set
            }
        case 'week/deleteSelf':
            if(state.weekworkflow_set.indexOf(action.payload.parent_id)>=0){
                var new_state = {...state};
                new_state.weekworkflow_set = state.weekworkflow_set.slice();
                new_state.weekworkflow_set.splice(new_state.weekworkflow_set.indexOf(action.payload.parent_id),1);
                return new_state;
            }
            return state;
        case 'week/insertBelow':
            new_state = {...state}
            var new_weekworkflow_set = state.weekworkflow_set.slice();
            new_weekworkflow_set.splice(new_weekworkflow_set.indexOf(action.payload.siblingID)+1,0,action.payload.new_through.id);
            new_state.weekworkflow_set = new_weekworkflow_set;
            return new_state;
        case 'strategy/addStrategy':
            new_state = {...state}
            var new_weekworkflow_set = state.weekworkflow_set.slice();
            new_weekworkflow_set.splice(action.payload.index,0,action.payload.new_through.id);
            new_state.weekworkflow_set = new_weekworkflow_set;
            if(action.payload.columnworkflows_added.length>0){
                let new_columnworkflow_set = state.columnworkflow_set.slice();
                new_columnworkflow_set.push(...action.payload.columnworkflows_added.map(columnworkflow=>columnworkflow.id));
                new_state.columnworkflow_set = new_columnworkflow_set;
            }
            return new_state;
        case 'column/deleteSelf':
            if(state.columnworkflow_set.indexOf(action.payload.parent_id)>=0){
                var new_state = {...state};
                new_state.columnworkflow_set = state.columnworkflow_set.slice();
                new_state.columnworkflow_set.splice(new_state.columnworkflow_set.indexOf(action.payload.parent_id),1);
                return new_state;
            }
            return state;
        case 'node/newNode':
            if(state.columnworkflow_set.indexOf(action.payload.columnworkflow.id)>=0)return state;
            new_state = {...state}
            var new_columnworkflow_set = state.columnworkflow_set.slice();
            new_columnworkflow_set.push(action.payload.columnworkflow.id);
            new_state.columnworkflow_set = new_columnworkflow_set;
            return new_state;
        case 'column/insertBelow':
            new_state = {...state}
            var new_columnworkflow_set = state.columnworkflow_set.slice();
            new_columnworkflow_set.splice(new_columnworkflow_set.indexOf(action.payload.siblingID)+1,0,action.payload.new_through.id);
            new_state.columnworkflow_set = new_columnworkflow_set;
            return new_state;
        case 'workflow/changeField':
            var new_state = {...state};
            new_state[action.payload.field]=action.payload.value;
            let json = {};
            json[action.payload.field]=action.payload.value;
            if(!read_only)updateValue(action.payload.id,"workflow",json);
            return new_state;
        default:
            return state;
    }
}

export function columnworkflowReducer(state={},action){
    switch(action.type){
        case 'column/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parent_id){
                    var new_state=state.slice();
                    new_state.splice(i,1);
                    return new_state;
                }
            }
            return state;
        case 'node/newNode':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.columnworkflow.id)return state;
            }
            new_state = state.slice();
            new_state.push(action.payload.columnworkflow);
            return new_state;
        case 'column/insertBelow':
            new_state = state.slice();
            new_state.push(action.payload.new_through);
            return new_state;
        case 'strategy/addStrategy':
            if(action.payload.columnworkflows_added.length==0)return state;
            new_state=state.slice();
            new_state.push(...action.payload.columnworkflows_added);
            return new_state;
        default:
            return state;
    }
}

export function columnReducer(state={},action){
    switch(action.type){
        case 'column/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state.splice(i,1);
                    deleteSelf(action.payload.id,"column");
                    return new_state;
                }
            }
            return state;
        case 'node/newNode':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.column.id)return state;
            }
            new_state = state.slice();
            new_state.push(action.payload.column);
            return new_state;
        case 'column/insertBelow':
            new_state = state.slice();
            new_state.push(action.payload.new_model);
            return new_state;
        case 'column/changeField':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]};
                    new_state[i][action.payload.field]=action.payload.value;
                    let json = {};
                    json[action.payload.field]=action.payload.value;
                    if(!read_only)updateValue(action.payload.id,"column",json);
                    return new_state;
                }
            }
            return state;
        case 'strategy/addStrategy':
            if(action.payload.columns_added.length==0)return state;
            new_state=state.slice();
            new_state.push(...action.payload.columns_added);
            return new_state;
        default:
            return state;
    }
}

export function weekworkflowReducer(state={},action){
    switch(action.type){
        case 'week/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parent_id){
                    var new_state=state.slice();
                    new_state.splice(i,1);
                    return new_state;
                }
            }
            return state;
        case 'week/insertBelow':
            new_state = state.slice();
            new_state.push(action.payload.new_through);
            return new_state;
        case 'strategy/addStrategy':
            new_state=state.slice();
            new_state.push(action.payload.new_through);
            return new_state;
        default:
            return state;
    }
}
export function weekReducer(state={},action){
    switch(action.type){
        case 'nodeweek/movedTo':
            let old_parent,old_parent_index,new_parent,new_parent_index;
            for(var i=0;i<state.length;i++){
                if(state[i].nodeweek_set.indexOf(action.payload.id)>=0){
                    old_parent_index=i;
                    old_parent={...state[i]};
                }
                if(state[i].id==action.payload.new_parent){
                    new_parent_index=i;
                    new_parent={...state[i]};
                }
            }
            var new_index = action.payload.new_index;
            //Correction for if we are in a term:
            if(action.payload.nodes_by_column){
                for(var col in action.payload.nodes_by_column){
                    if(action.payload.nodes_by_column[col].indexOf(action.payload.id)>=0){
                        let previous = action.payload.nodes_by_column[col][new_index];
                        new_index = new_parent.nodeweek_set.indexOf(previous);
                    }
                }
            }
            
            
            var new_state = state.slice();
            old_parent.nodeweek_set= old_parent.nodeweek_set.slice();
            old_parent.nodeweek_set.splice(old_parent.nodeweek_set.indexOf(action.payload.id),1);
            if(old_parent_index==new_parent_index){
                old_parent.nodeweek_set.splice(new_index,0,action.payload.id);
            }else{
                new_parent.nodeweek_set = new_parent.nodeweek_set.slice();
                new_parent.nodeweek_set.splice(new_index,0,action.payload.id);
                new_state.splice(new_parent_index,1,new_parent);
                
            }
            new_state.splice(old_parent_index,1,old_parent);
            insertedAt(action.payload.id,"nodeweek",new_parent.id,new_index);
            return new_state;
        case 'node/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].nodeweek_set.indexOf(action.payload.parent_id)>=0){
                    var new_state=state.slice();
                    new_state[i] = {...new_state[i]};
                    new_state[i].nodeweek_set = state[i].nodeweek_set.slice();
                    new_state[i].nodeweek_set.splice(new_state[i].nodeweek_set.indexOf(action.payload.parent_id),1);
                    return new_state;
                }
            }
            return state;
        case 'node/insertBelow':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parentID){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]}
                    var new_nodeweek_set = state[i].nodeweek_set.slice();
                    new_nodeweek_set.splice(new_nodeweek_set.indexOf(action.payload.siblingID)+1,0,action.payload.new_through.id);
                    new_state[i].nodeweek_set = new_nodeweek_set;
                    return new_state;
                }
            }
            return state;
        case 'node/newNode':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parentID){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]}
                    var new_nodeweek_set = state[i].nodeweek_set.slice();
                    new_nodeweek_set.splice(action.payload.index,0,action.payload.new_through.id);
                    new_state[i].nodeweek_set = new_nodeweek_set;
                    return new_state;
                }
            }
            return state;
        case 'week/insertBelow':
            new_state = state.slice();
            new_state.push(action.payload.new_model);
            return new_state;
        case 'week/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state.splice(i,1);
                    deleteSelf(action.payload.id,"week");
                    return new_state;
                }
            }
            return state;
        case 'week/changeField':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]};
                    new_state[i][action.payload.field]=action.payload.value;
                    let json = {};
                    json[action.payload.field]=action.payload.value;
                    if(!read_only)updateValue(action.payload.id,"week",json);
                    return new_state;
                }
            }
            return state;
        case 'strategy/toggleStrategy':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]};
                    new_state[i].is_strategy = action.payload.is_strategy;
                    return new_state;
                }
            }
            return state;
        case 'strategy/addStrategy':
            new_state=state.slice();
            new_state.push(action.payload.strategy);
            return new_state;
        default:
            return state;
    }
}
export function nodeweekReducer(state={},action){
    switch(action.type){
        case 'node/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parent_id){
                    var new_state=state.slice();
                    new_state.splice(i,1);
                    return new_state;
                }
            }
            return state;
        case 'week/insertBelow':
            if(!action.payload.children_through)return state;
            new_state = state.slice();
            for(var i=0;i<action.payload.children_through.length;i++){
                new_state.push(action.payload.children_through[i]);
            }
            return new_state;
        case 'node/insertBelow':
        case 'node/newNode':
            new_state = state.slice();
            new_state.push(action.payload.new_through);
            return new_state;
        case 'strategy/addStrategy':
            if(action.payload.nodeweeks_added.length==0)return state;
            new_state=state.slice();
            new_state.push(...action.payload.nodeweeks_added);
            return new_state;
        default:
            return state;
    }
}
export function nodeReducer(state={},action){
    switch(action.type){
        case 'column/deleteSelf':
            var new_state = state.slice();
            var new_column;
            console.log(action.payload)
            if(action.payload.extra_data){
                new_column = action.payload.extra_data[0];
                if(new_column==action.payload.id)new_column=action.payload.extra_data[1];
            }
            
            for(var i=0;i<state.length;i++){
                if(state[i].column==action.payload.id){
                    new_state[i]={...state[i]};
                    new_state[i].column=new_column;
                }
            }
            return new_state;
        case 'node/movedColumnBy':
            var new_state = state.slice();
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    try{
                        let columns = action.payload.columns;
                        let old_column_index = columns.indexOf(state[i].column);
                        let new_column_index = old_column_index+action.payload.delta_x;
                        if(new_column_index<0 || new_column_index>=columns.length)return state;
                        let new_column = columns[new_column_index];
                        var new_nodedata = {
                            ...state[i],
                            column:new_column,
                        };
                        new_state.splice(i,1,new_nodedata);
                        columnChanged(action.payload.id,new_column);
                    }catch(err){console.log("couldn't find new column");return state;}
                    return new_state;
                }
            }
            return state;
        case 'node/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state.splice(i,1);
                    deleteSelf(action.payload.id,"node",
                    ()=>{Constants.triggerHandlerEach($(".week .node"),"component-updated")});
                    return new_state;
                }
            }
            return state;
        case 'nodelink/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].outgoing_links.indexOf(action.payload.id)>=0){
                    var new_state=state.slice();
                    new_state[i] = {...new_state[i]};
                    new_state[i].outgoing_links = state[i].outgoing_links.slice();
                    new_state[i].outgoing_links.splice(new_state[i].outgoing_links.indexOf(action.payload.id),1);
                    return new_state;
                }
            }
            return state;
        case 'outcomenode/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].outcomenode_set.indexOf(action.payload.id)>=0){
                    var new_state=state.slice();
                    new_state[i] = {...new_state[i]};
                    new_state[i].outcomenode_set = state[i].outcomenode_set.slice();
                    new_state[i].outcomenode_set.splice(new_state[i].outcomenode_set.indexOf(action.payload.id),1);
                    return new_state;
                }
            }
            return state;
        case 'week/insertBelow':
            if(!action.payload.children)return state;
            new_state = state.slice();
            for(var i=0;i<action.payload.children.length;i++){
                new_state.push(action.payload.children[i]);
            }
            return new_state;
        case 'node/insertBelow':
        case 'node/newNode':
            new_state = state.slice();
            new_state.push(action.payload.new_model);
            return new_state;
        case 'node/changeField':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]};
                    new_state[i][action.payload.field]=action.payload.value;
                    let json = {};
                    json[action.payload.field]=action.payload.value;
                    if(!read_only)updateValue(action.payload.id,"node",json);
                    return new_state;
                }
            }
            return state;
        case 'node/setLinkedWorkflow':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]};
                    new_state[i].linked_workflow=action.payload.linked_workflow;
                    new_state[i].linked_workflow_title = action.payload.linked_workflow_title;
                    new_state[i].linked_workflow_description = action.payload.linked_workflow_description;
                    return new_state;
                }
            }
            return state;
        case 'nodelink/newNodeLink':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.new_model.source_node){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]}
                    var new_outgoing_links = state[i].outgoing_links.slice();
                    new_outgoing_links.push(action.payload.new_model.id);
                    new_state[i].outgoing_links = new_outgoing_links;
                    return new_state;
                }
            }
            return state;
        case 'outcome/addToNode':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.outcomenode.node){
                    var new_state=state.slice();
                    new_state[i] = {...new_state[i]};
                    new_state[i].outcomenode_set = new_state[i].outcomenode_set.slice();
                    new_state[i].outcomenode_set.push(action.payload.outcomenode.id);
                    return new_state;
                }
            }
            return state;
        case 'strategy/addStrategy':
            if(action.payload.nodes_added.length==0)return state;
            new_state=state.slice();
            new_state.push(...action.payload.nodes_added);
            return new_state;
        default:
            return state;
    }
}
export function nodelinkReducer(state={},action){
    switch(action.type){
        case 'node/insertBelow':
        case 'node/newNode':
        case 'node/deleteSelf':
            return state;
        case 'nodelink/newNodeLink':
            new_state = state.slice();
            new_state.push(action.payload.new_model);
            return new_state;
        case 'nodelink/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state.splice(i,1);
                    deleteSelf(action.payload.id,"nodelink")
                    return new_state;
                }
            }
            return state;
        case 'strategy/addStrategy':
            if(action.payload.nodelinks_added.length==0)return state;
            new_state=state.slice();
            new_state.push(...action.payload.nodelinks_added);
            return new_state;
        default:
            return state;
    }
}
export function outcomeReducer(state={},action){
    switch(action.type){
        case 'outcomeoutcome/movedTo':
            let old_parent, old_parent_index,new_parent,new_parent_index;
            for(var i=0;i<state.length;i++){
                if(state[i].child_outcome_links.indexOf(action.payload.id)>=0){
                    old_parent_index=i;
                    old_parent={...state[i]};
                }
                if(state[i].id==action.payload.new_parent){
                    new_parent_index=i;
                    new_parent={...state[i]};
                }
            }
            var new_index = action.payload.new_index;
            var new_state = state.slice();
            old_parent.child_outcome_links = old_parent.child_outcome_links.slice();
            old_parent.child_outcome_links.splice(old_parent.child_outcome_links.indexOf(action.payload.id),1);
            if(old_parent_index==new_parent_index){
                old_parent.child_outcome_links.splice(new_index,0,action.payload.id);
            }else{
                new_parent.child_outcome_links = new_parent.child_outcome_links.slice();
                new_parent.child_outcome_links.splice(new_index,0,action.payload.id);
                new_state.splice(new_parent_index,1,new_parent);
            }
            new_state.splice(old_parent_index,1,old_parent);
            insertedAt(action.payload.id,"outcomeoutcome",new_parent.id,new_index);
            return new_state;
        case 'outcome/deleteSelf':
            var new_state=state.slice();
            for(var i=0;i<state.length;i++){
                if(state[i].child_outcome_links.indexOf(action.payload.parent_id)>=0){
                    new_state[i] = {...new_state[i]};
                    new_state[i].child_outcome_links = state[i].child_outcome_links.slice();
                    new_state[i].child_outcome_links.splice(new_state[i].child_outcome_links.indexOf(action.payload.parent_id),1);
                }else if(state[i].id==action.payload.id){
                    new_state.splice(i,1);
                    deleteSelf(action.payload.id,"outcome");
                }
            }
            return new_state;
        case 'outcome/insertChild':
        case 'outcome/insertBelow':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parentID){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]}
                    var new_child_outcome_links = state[i].child_outcome_links.slice();
                    let new_index;
                    if(action.payload.siblingID===undefined)new_index=new_child_outcome_links.length;
                    else new_index= new_child_outcome_links.indexOf(action.payload.siblingID)+1;
                    new_child_outcome_links.splice(new_index,0,action.payload.new_through.id);
                    new_state[i].child_outcome_links = new_child_outcome_links;
                    new_state.push(action.payload.new_model);
                    if(action.payload.children){
                        for(var i=0;i<action.payload.children.length;i++){
                            new_state.push(action.payload.children[i]);
                        }
                    }
                    return new_state;
                }
            }
            return state;
        case 'outcome/changeField':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]};
                    new_state[i][action.payload.field]=action.payload.value;
                    let json = {};
                    json[action.payload.field]=action.payload.value;
                    if(!read_only)updateValue(action.payload.id,"outcome",json);
                    return new_state;
                }
            }
            return state;
        default:
            return state;
    }
}
export function outcomeOutcomeReducer(state={},action){
    switch(action.type){
        case 'outcome/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parent_id){
                    var new_state=state.slice();
                    new_state.splice(i,1);
                    return new_state;
                }
            }
            return state;
        case 'outcome/insertChild':
        case 'outcome/insertBelow':
            var new_state = state.slice();
            new_state.push(action.payload.new_through);
            if(action.payload.children_through){
                for(var i=0;i<action.payload.children_through.length;i++){
                    new_state.push(action.payload.children_through[i]);
                }
            }
            return new_state;
        default:
            return state;
    }
}
export function outcomeNodeReducer(state={},action){
    switch(action.type){
        case 'outcome/addToNode':
            var new_state = state.slice();
            new_state.push(action.payload.outcomenode);
            return new_state;
        case 'outcomenode/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    unlinkOutcomeFromNode(state[i].node,state[i].outcome)
                    new_state.splice(i,1);
                    return new_state;
                }
            }
            return state;
        case 'outcomenode/changeField':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]};
                    new_state[i][action.payload.field]=action.payload.value;
                    let json = {};
                    json[action.payload.field]=action.payload.value;
                    if(!read_only)updateOutcomenodeDegree(new_state[i].node,new_state[i].outcome,action.payload.value);
                    return new_state;
                }
            }
            return state;
        default:
            return state;
    }
}
export function outcomeProjectReducer(state={},action){
    switch(action.type){
        default:
            return state;
    }
}
export function strategyReducer(state={},action){
    switch(action.type){
        case 'strategy/toggleStrategy':
            if(!action.payload.is_strategy)return state;
            let new_state=state.slice();
            new_state.push(action.payload.strategy);
            return new_state;
        default:
            return state;
    }
}
export function saltiseStrategyReducer(state={},action){
    switch(action.type){
        default:
            return state;
    }
}

export function homeMenuReducer(state={},action){
    switch(action.type){
        case 'homemenu/itemAdded':
            var new_state = {...state}
            if(action.payload.type!="project"){
                new_state.owned_strategies = {...new_state.owned_strategies };
                new_state.owned_strategies.sections = new_state.owned_strategies.sections.slice();
                for(var i=0;i<new_state.owned_projects.sections.length;i++){
                    if(new_state.owned_strategies.sections[i].object_type==action.payload.type){
                        new_state.owned_strategies.sections[i].objects=new_state.owned_strategies.sections[i].objects.slice()
                        new_state.owned_strategies.sections[i].objects.push(action.payload.new_item);
                    }
                }
            }else{
                new_state.owned_projects = {...new_state.owned_projects};
                new_state.owned_projects.sections = new_state.owned_projects.sections.slice();
                for(var i=0;i<new_state.owned_projects.sections.length;i++){
                    if(new_state.owned_projects.sections[i].object_type==action.payload.type){
                        new_state.owned_projects.sections[i].objects=new_state.owned_projects.sections[i].objects.slice()
                        new_state.owned_projects.sections[i].objects.push(action.payload.new_item);
                    }
                }
            }
            return new_state;
        default:
            return state;
    }
}
export function projectMenuReducer(state={},action){
    switch(action.type){
        case 'homemenu/itemAdded':
            var new_state = {...state}
            new_state.current_project = {...new_state.current_project};
            new_state.current_project.sections = new_state.current_project.sections.slice();
            for(var i=0;i<new_state.current_project.sections.length;i++){
                if(new_state.current_project.sections[i].object_type==action.payload.type){
                    new_state.current_project.sections[i].objects=new_state.current_project.sections[i].objects.slice()
                    new_state.current_project.sections[i].objects.push(action.payload.new_item);
                }
            }
            return new_state;
        default:
            return state;
    }
}