import * as Constants from "./Constants.js";
import {deleteSelf, updateValue, updateOutcomenodeDegree} from "./PostFunctions.js"
import * as Redux from "redux";

export const moveColumnWorkflow = (id,new_position,new_parent,child_id) => {
    return {
        type: 'columnworkflow/movedTo',
        payload:{id:id,new_index:new_position,new_parent:new_parent,child_id:child_id}
    }
}

export const moveWeekWorkflow = (id,new_position,new_parent,child_id) => {
    return {
        type: 'weekworkflow/movedTo',
        payload:{id:id,new_index:new_position,new_parent:new_parent,child_id:child_id}
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

export const newOutcomeAction = (response_data) => {
    return {
        type: "outcome/newOutcome",
        payload:response_data
    }
}

export const columnChangeNode = (id,new_column) => {
    return {
        type: 'node/changedColumn',
        payload:{id:id,new_column:new_column}
    }
}

export const moveNodeWeek = (id,new_position,new_parent,nodes_by_column,child_id) => {
    return {
        type: 'nodeweek/movedTo',
        payload:{id:id,new_index:new_position,new_parent:new_parent,nodes_by_column:nodes_by_column,child_id:child_id}
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

export const moveOutcomeOutcome = (id,new_position,new_parent,child_id) => {
    return {
        type: 'outcomeoutcome/movedTo',
        payload:{id:id,new_index:new_position,new_parent:new_parent,child_id:child_id}
    }
}

export const updateOutcomenodeDegreeAction = (response_data) => {
    return {
        type: "outcomenode/updateDegree",
        payload:response_data
    }
}
export const updateOutcomehorizontallinkDegreeAction = (response_data) => {
    return {
        type: "outcomehorizontallink/updateDegree",
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
export const gridMenuItemAdded = (response_data) => {
    return {
        type: "gridmenu/itemAdded",
        payload:response_data
    }
}

export const replaceStoreData = (data_package) =>{
    return {
        type: 'replaceStoreData',
        payload: data_package
    }
}


export function workflowReducer(state={},action){
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.workflow)return action.payload.workflow;
            return state;
        case 'weekworkflow/changeID':
            var new_state={...state};
            var old_index = state.weekworkflow_set.indexOf(action.payload.old_id);
            if(old_index>=0){
                new_state.weekworklow_set=new_state.weekworkflow_set.slice();
                new_state.weekworkflow_set.splice(old_index,1,action.payload.new_id);
            }
            return new_state;
        case 'columnworkflow/changeID':
            var new_state={...state};
            var old_index = state.columnworkflow_set.indexOf(action.payload.old_id);
            if(old_index>=0){
                new_state.columnworklow_set=new_state.columnworkflow_set.slice();
                new_state.columnworkflow_set.splice(old_index,1,action.payload.new_id);
            }
            return new_state;
        case 'columnworkflow/movedTo':
            var new_columnworkflow_set = state.columnworkflow_set.slice();
            for(var i=0;i<new_columnworkflow_set.length;i++){
                if(new_columnworkflow_set[i]==action.payload.id){
                    new_columnworkflow_set.splice(action.payload.new_index,0,new_columnworkflow_set.splice(i,1)[0]);
                    break;
                }
            }
            //insertedAt(action.payload.child_id,"column",action.payload.new_parent,"workflow",action.payload.new_index,"columnworkflow");
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
            //insertedAt(action.payload.child_id,"week",action.payload.new_parent,"workflow",action.payload.new_index,"weekworkflow");
            return {
                ...state,
                weekworkflow_set:new_weekworkflow_set
            }
        case 'outcomeworkflow/movedTo':
            var new_outcomeworkflow_set = state.outcomeworkflow_set.slice();
            for(var i=0;i<new_outcomeworkflow_set.length;i++){
                if(new_outcomeworkflow_set[i]==action.payload.id){
                    new_outcomeworkflow_set.splice(action.payload.new_index,0,new_outcomeworkflow_set.splice(i,1)[0]);
                    break;
                }
            }
            //insertedAt(action.payload.child_id,"outcome",action.payload.new_parent,"workflow",action.payload.new_index,"outcomeworkflow");
            return {
                ...state,
                outcomeworkflow_set:new_outcomeworkflow_set
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
            new_weekworkflow_set.splice(action.payload.new_through.rank,0,action.payload.new_through.id);
            new_state.weekworkflow_set = new_weekworkflow_set;
            return new_state;
        case 'outcome_base/deleteSelf':
            if(state.outcomeworkflow_set.indexOf(action.payload.parent_id)>=0){
                var new_state = {...state};
                new_state.outcomeworkflow_set = state.outcomeworkflow_set.slice();
                new_state.outcomeworkflow_set.splice(new_state.outcomeworkflow_set.indexOf(action.payload.parent_id),1);
                return new_state;
            }
            return state;
        case 'outcome_base/insertBelow':
        case 'outcome/newOutcome':
            new_state = {...state}
            var new_outcomeworkflow_set = state.outcomeworkflow_set.slice();
            new_outcomeworkflow_set.splice(action.payload.new_through.rank,0,action.payload.new_through.id);
            new_state.outcomeworkflow_set = new_outcomeworkflow_set;
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
            new_columnworkflow_set.splice(action.payload.new_through.rank,0,action.payload.new_through.id);
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

export function outcomeworkflowReducer(state={},action){
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.outcomeworkflow)return action.payload.outcomeworkflow;
            return state;
        case 'outcome_base/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].outcome==action.payload.id){
                    var new_state=state.slice();
                    new_state.splice(i,1);
                    return new_state;
                }
            }
            return state;
        case 'outcome_base/insertBelow':
            new_state = state.slice();
            new_state.push(action.payload.new_through);
            return new_state;
        case 'outcome/newOutcome':
            new_state = state.slice();
            new_state.push(action.payload.new_through);
            return new_state;
        default:
            return state;
    }
}

export function columnworkflowReducer(state={},action){
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.columnworkflow)return action.payload.columnworkflow;
            return state;
        case 'columnworkflow/changeID':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.old_id){
                    var new_state=state.slice();
                    new_state[i]={...new_state[i],id:action.payload.new_id}
                    return new_state;
                }
            }
            return state;
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
        case 'replaceStoreData':
            if(action.payload.column)return action.payload.column;
            return state;
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
        case 'replaceStoreData':
            if(action.payload.weekworkflow)return action.payload.weekworkflow;
            return state;
        case 'weekworkflow/changeID':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.old_id){
                    var new_state=state.slice();
                    new_state[i]={...new_state[i],id:action.payload.new_id}
                    return new_state;
                }
            }
            return state;
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
    console.log(action);
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.week)return action.payload.week;
            return state;
        case 'nodeweek/changeID':
            var new_state=state.slice();
            for(var i=0;i<state.length;i++){
                let old_index = state[i].nodeweek_set.indexOf(action.payload.old_id);
                if(old_index>=0){
                    new_state[i]={...new_state[i]}
                    new_state[i].nodeweek_set=new_state[i].nodeweek_set.slice();
                    new_state[i].nodeweek_set.splice(old_index,1,action.payload.new_id);
                }
            }
            return new_state;
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
            console.log("adding node below")
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parentID){
                    console.log("found parent id");
                    var new_state = state.slice();
                    new_state[i] = {...state[i]}
                    var new_nodeweek_set = state[i].nodeweek_set.slice();
                    new_nodeweek_set.splice(action.payload.new_through.rank,0,action.payload.new_through.id);
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
        case 'replaceStoreData':
            if(action.payload.nodeweek)return action.payload.nodeweek;
            return state;
        case 'nodeweek/changeID':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.old_id){
                    var new_state=state.slice();
                    new_state[i]={...new_state[i],id:action.payload.new_id}
                    return new_state;
                }
            }
            return state;
        case 'node/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parent_id){
                    var new_state=state.slice();
                    new_state.splice(i,1);
                    return new_state;
                }
            }
            return state;
        case 'nodeweek/movedTo':
            new_state = state.slice();
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    new_state[i]={...state[i],week:action.payload.new_parent}
                }
            }
            return new_state;
        case 'week/insertBelow':
            if(!action.payload.children)return state;
            new_state = state.slice();
            for(var i=0;i<action.payload.children.nodeweek.length;i++){
                new_state.push(action.payload.children.nodeweek[i]);
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
        case 'replaceStoreData':
            if(action.payload.node)return action.payload.node;
            return state;
        case 'column/deleteSelf':
            var new_state = state.slice();
            var new_column;
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
        case 'node/changedColumn':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state[i]={...new_state[i],column:action.payload.new_column}
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
        case 'week/insertBelow':
            if(!action.payload.children)return state;
            new_state = state.slice();
            for(var i=0;i<action.payload.children.node.length;i++){
                new_state.push(action.payload.children.node[i]);
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
                    new_state[i].linked_workflow_data = action.payload.linked_workflow_data;
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
        case 'outcomenode/updateDegree':
            //Returns -1 if the outcome had already been added to the node at the given degree
            if(action.payload.outcomenode==-1)return state;
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.data_package[0].node){
                    var new_state=state.slice();
                    new_state[i] = {...new_state[i]};
                    new_state[i].outcomenode_set = action.payload.new_outcomenode_set;
                    new_state[i].outcomenode_unique_set = action.payload.new_outcomenode_unique_set;
                    return new_state;
                }
            }
            return state;
        case 'strategy/addStrategy':
            if(action.payload.nodes_added.length==0)return state;
            new_state=state.slice();
            new_state.push(...action.payload.nodes_added);
            return new_state;
        case 'outcome/deleteSelf':
        case 'outcome_base/deleteSelf':
            new_state=state.slice();
            for(var i=0;i<action.payload.extra_data.length;i++){
                if(action.payload.extra_data[i].outcome==action.payload.id){
                    let outcomenode = action.payload.extra_data[i];
                    for(var j=0;j<new_state.length;j++){
                        let outcomenode_index=new_state[j].outcomenode_set.indexOf(outcomenode.id);
                        if(outcomenode_index>=0){
                            new_state[j]={...new_state[j]};
                            new_state[j].outcomenode_set=new_state[j].outcomenode_set.slice();
                            new_state[j].outcomenode_set.splice(outcomenode_index,1);
                            let outcomenode_unique_index=new_state[j].outcomenode_unique_set.indexOf(outcomenode.id);
                            if(outcomenode_unique_index>=0){
                                new_state[j].outcomenode_unique_set=new_state[j].outcomenode_unique_set.slice();
                                new_state[j].outcomenode_unique_set.splice(outcomenode_unique_index,1);
                            }
                        }
                    }
                }
            }
            return new_state;
        default:
            return state;
    }
}
export function nodelinkReducer(state={},action){
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.nodelink)return action.payload.nodelink;
            return state;
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
        case 'week/insertBelow':
            if(!action.payload.children)return state;
            new_state = state.slice();
            for(var i=0;i<action.payload.children.nodelink.length;i++){
                new_state.push(action.payload.children.nodelink[i]);
            }
            return new_state;
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
        case 'replaceStoreData':
            if(action.payload.outcome)return action.payload.outcome;
            return state;
        case 'outcomeoutcome/changeID':
            var new_state=state.slice();
            for(var i=0;i<state.length;i++){
                let old_index = state[i].child_outcome_links.indexOf(action.payload.old_id);
                if(old_index>=0){
                    new_state[i]={...new_state[i]}
                    new_state[i].child_outcome_links=new_state[i].child_outcome_links.slice();
                    new_state[i].child_outcome_links.splice(old_index,1,action.payload.new_id);
                }
            }
            return new_state;
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
            //insertedAt(action.payload.child_id,"outcome",new_parent.id,"outcome",new_index,"outcomeoutcome");
            return new_state;
        case 'outcome_base/deleteSelf':
            var new_state=state.slice();
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    new_state.splice(i,1);
                    deleteSelf(action.payload.id,"outcome");
                    return new_state;
                }
            }
            return state;
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
        case "outcome_base/insertBelow":
        case 'outcome/newOutcome':
            var new_state=state.slice();
            new_state.push(action.payload.new_model);
            if(action.payload.children){
                for(var i=0;i<action.payload.children.outcome.length;i++){
                    new_state.push(action.payload.children.outcome[i]);
                }
            }
            return new_state;
        case 'outcome/insertChild':
        case 'outcome_base/insertChild':
        case 'outcome/insertBelow':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parentID){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]}
                    var new_child_outcome_links = state[i].child_outcome_links.slice();
                    let new_index;
                    new_index= action.payload.new_through.rank;
                    new_child_outcome_links.splice(new_index,0,action.payload.new_through.id);
                    new_state[i].child_outcome_links = new_child_outcome_links;
                    new_state.push(action.payload.new_model);
                    if(action.payload.children){
                        for(var i=0;i<action.payload.children.outcome.length;i++){
                            new_state.push(action.payload.children.outcome[i]);
                        }
                    }
                    return new_state;
                }
            }
            return state;
        case 'outcome/changeField':
        case 'outcome_base/changeField':
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
        case 'outcomehorizontallink/updateDegree':
            //Returns -1 if the outcome had already been added to the node
            if(action.payload.outcomenode==-1)return state;
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.data_package[0].outcome){
                    var new_state=state.slice();
                    new_state[i] = {...new_state[i]};
                    new_state[i].outcome_horizontal_links = action.payload.new_outcome_horizontal_links;
                    new_state[i].outcome_horizontal_links_unique = action.payload.new_outcome_horizontal_links_unique;
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
        case 'replaceStoreData':
            if(action.payload.outcomeoutcome)return action.payload.outcomeoutcome;
            return state;
        case 'outcomeoutcome/changeID':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.old_id){
                    var new_state=state.slice();
                    new_state[i]={...new_state[i],id:action.payload.new_id}
                    return new_state;
                }
            }
            return state;
        case 'outcome/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parent_id){
                    var new_state=state.slice();
                    new_state.splice(i,1);
                    return new_state;
                }
            }
            return state;
        case 'outcome_base/insertBelow':
            var new_state = state.slice();
            if(action.payload.children){
                for(var i=0;i<action.payload.children.outcomeoutcome.length;i++){
                    new_state.push(action.payload.children.outcomeoutcome[i]);
                }
            }
            return new_state;
        case 'outcome/insertChild':
        case 'outcome/insertBelow':
            var new_state = state.slice();
            new_state.push(action.payload.new_through);
            if(action.payload.children){
                for(var i=0;i<action.payload.children.outcomeoutcome.length;i++){
                    new_state.push(action.payload.children.outcomeoutcome[i]);
                }
            }
            return new_state;
        default:
            return state;
    }
}
export function outcomeNodeReducer(state={},action){
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.outcomenode)return action.payload.outcomenode;
            return state;
        case 'outcomenode/updateDegree':
            //Returns -1 if the outcome had already been added to the node
            if(action.payload.outcomenode==-1)return state;
            var new_state = state.slice();
            let new_outcomenode_outcomes = action.payload.data_package.map((outcomenode)=>
                Constants.cantorPairing(outcomenode.node,outcomenode.outcome)
            )
            for(var i=0;i<new_state.length;i++){
                let new_outcomenode_index = new_outcomenode_outcomes.indexOf(Constants.cantorPairing(new_state[i].node,new_state[i].outcome));
                if(new_outcomenode_index>=0){
                    new_state[i]=action.payload.data_package[new_outcomenode_index];
                    action.payload.data_package[new_outcomenode_index]=null;
                }
            }
            for(var i=0;i<action.payload.data_package.length;i++){
                if(action.payload.data_package[i]!=null)new_state.push(action.payload.data_package[i]);
            }
            new_state = new_state.filter(outcomenode => outcomenode.degree>0);
            return new_state;
        case 'outcome/deleteSelf':
        case 'outcome_base/deleteSelf':
            new_state=state.slice();
            for(var i=0;i<new_state.length;i++){
                if(new_state[i].outcome==action.payload.id){
                    new_state.splice(i,1);
                    i--;
                }
            }
            return new_state;
        case 'week/insertBelow':
        case 'node/insertBelow':
            if(!action.payload.children)return state;
            new_state = state.slice();
            for(var i=0;i<action.payload.children.outcomenode.length;i++){
                new_state.push(action.payload.children.outcomenode[i]);
            }
            return new_state;
        default:
            return state;
    }
}
export function parentOutcomeReducer(state={},action){
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.parent_outcome)return action.payload.parent_outcome;
            return state;
        default:
            return state;
    }
}
export function parentOutcomeoutcomeReducer(state={},action){
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.parent_outcomeoutcome)return action.payload.parent_outcomeoutcome;
            return state;
        default:
            return state;
    }
}
export function parentOutcomeworkflowReducer(state={},action){
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.parent_outcomeworkflow)return action.payload.parent_outcomeworkflow;
            return state;
        default:
            return state;
    }
}
export function parentOutcomenodeReducer(state={},action){
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.parent_outcomenode)return action.payload.parent_outcomenode;
            return state;
        default:
            return state;
    }
}
export function outcomeHorizontalLinkReducer(state={},action){
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.outcomehorizontallink)return action.payload.outcomehorizontallink;
            return state;
        case 'outcomehorizontallink/updateDegree':
            //Returns -1 if the outcome had already been added to the node
            if(action.payload.outcomehorizontallink==-1)return state;
            var new_state = state.slice();
            let new_outcomehorizontallink_outcomes = action.payload.data_package.map((outcomehorizontallink)=>
                Constants.cantorPairing(outcomehorizontallink.outcome,outcomehorizontallink.parent_outcome)
            )
            for(var i=0;i<new_state.length;i++){
                let new_outcomehorizontallink_index = new_outcomehorizontallink_outcomes.indexOf(Constants.cantorPairing(new_state[i].outcome,new_state[i].parent_outcome));
                if(new_outcomehorizontallink_index>=0){
                    new_state[i]=action.payload.data_package[new_outcomehorizontallink_index];
                    action.payload.data_package[new_outcomehorizontallink_index]=null;
                }
            }
            for(var i=0;i<action.payload.data_package.length;i++){
                if(action.payload.data_package[i]!=null)new_state.push(action.payload.data_package[i]);
            }
            new_state = new_state.filter(outcomehorizontallink => outcomehorizontallink.degree>0);
            return new_state;
        default:
        return state;
    }
}
export function parentNodeReducer(state={},action){
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.parent_node)return action.payload.parent_node;
            return state;
        default:
            return state;
    }
}
export function parentWorkflowReducer(state={},action){
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.parent_workflow)return action.payload.parent_workflow;
            return state;
        default:
            return state;
    }
}
export function childWorkflowReducer(state={},action){
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.child_workflow)return action.payload.child_workflow;
            return state;
        default:
            return state;
    }
}
export function childOutcomeReducer(state={},action){
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.child_outcome)return action.payload.child_outcome;
            return state;
        default:
            return state;
    }
}
export function childOutcomeOutcomeReducer(state={},action){
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.child_outcomeoutcome)return action.payload.child_outcomeoutcome;
            return state;
        default:
            return state;
    }
}
export function childOutcomeWorkflowReducer(state={},action){
    switch(action.type){
        case 'replaceStoreData':
            if(action.payload.child_outcomeworkflow)return action.payload.child_outcomeworkflow;
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

export function gridMenuReducer(state={},action){
    switch(action.type){
        case 'gridmenu/itemAdded':
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
        case 'gridmenu/itemAdded':
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


export const rootWorkflowReducer = Redux.combineReducers({
    workflow:workflowReducer,
    outcomeworkflow:outcomeworkflowReducer,
    columnworkflow:columnworkflowReducer,
    column:columnReducer,
    weekworkflow:weekworkflowReducer,
    week:weekReducer,
    nodeweek:nodeweekReducer,
    node:nodeReducer,
    nodelink:nodelinkReducer,
    outcome:outcomeReducer,
    outcomeoutcome:outcomeOutcomeReducer,
    outcomenode:outcomeNodeReducer,
    parent_outcome:parentOutcomeReducer,
    parent_outcomeoutcome:parentOutcomeoutcomeReducer,
    parent_outcomeworkflow:parentOutcomeworkflowReducer,
    parent_outcomenode:parentOutcomenodeReducer,
    parent_node:parentNodeReducer,
    parent_workflow:parentWorkflowReducer,
    outcomehorizontallink:outcomeHorizontalLinkReducer,
    child_workflow:childWorkflowReducer,
    child_outcome:childOutcomeReducer,
    child_outcomeoutcome:childOutcomeOutcomeReducer,
    child_outcomeworkflow:childOutcomeWorkflowReducer,
    outcomeproject:outcomeProjectReducer,
    strategy:strategyReducer,
    saltise_strategy:saltiseStrategyReducer,
});

export const rootOutcomeReducer = Redux.combineReducers({
    outcome:outcomeReducer,
    outcomeoutcome:outcomeOutcomeReducer,
});
