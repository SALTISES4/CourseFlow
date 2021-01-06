
export const moveColumnWorkflow = (id,new_position) => {
    return {
        type: 'columnworkflow/movedTo',
        payload:{id:id,new_index:new_position}
    }
}

export const moveStrategyWorkflow = (id,new_position) => {
    return {
        type: 'strategyworkflow/movedTo',
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

export const columnChangeNodeStrategy = (id,delta_x,columnworkflows) => {
    return {
        type: 'node/movedColumnBy',
        payload:{id:id,delta_x,columnworkflows:columnworkflows}
    }
}

export const moveNodeStrategy = (id,new_position,new_parent,nodes_by_column) => {
    return {
        type: 'nodestrategy/movedTo',
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
        case 'strategyworkflow/movedTo':
            var new_strategyworkflow_set = state.strategyworkflow_set.slice();
            for(var i=0;i<new_strategyworkflow_set.length;i++){
                if(new_strategyworkflow_set[i]==action.payload.id){
                    new_strategyworkflow_set.splice(action.payload.new_index,0,new_strategyworkflow_set.splice(i,1)[0]);
                    break;
                }
            }
            insertedAt(action.payload.id,"strategyworkflow",state.id,action.payload.new_index);
            return {
                ...state,
                strategyworkflow_set:new_strategyworkflow_set
            }
        case 'strategy/deleteSelf':
            if(state.strategyworkflow_set.indexOf(action.payload.parent_id)>=0){
                var new_state = {...state};
                new_state.strategyworkflow_set = state.strategyworkflow_set.slice();
                new_state.strategyworkflow_set.splice(new_state.strategyworkflow_set.indexOf(action.payload.parent_id),1);
                return new_state;
            }
            return state;
        case 'strategy/insertBelow':
            new_state = {...state}
            var new_strategyworkflow_set = state.strategyworkflow_set.slice();
            new_strategyworkflow_set.splice(new_strategyworkflow_set.indexOf(action.payload.siblingID)+1,0,action.payload.new_through.id);
            new_state.strategyworkflow_set = new_strategyworkflow_set;
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
        default:
            return state;
    }
}

export function strategyworkflowReducer(state={},action){
    switch(action.type){
        case 'strategy/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parent_id){
                    var new_state=state.slice();
                    new_state.splice(i,1);
                    return new_state;
                }
            }
            return state;
        case 'strategy/insertBelow':
            new_state = state.slice();
            new_state.push(action.payload.new_through);
            return new_state;
        default:
            return state;
    }
}
export function strategyReducer(state={},action){
    switch(action.type){
        case 'nodestrategy/movedTo':
            let old_parent,old_parent_index,new_parent,new_parent_index;
            for(var i=0;i<state.length;i++){
                if(state[i].nodestrategy_set.indexOf(action.payload.id)>=0){
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
                        new_index = new_parent.nodestrategy_set.indexOf(previous);
                    }
                }
            }
            
            
            var new_state = state.slice();
            old_parent.nodestrategy_set= old_parent.nodestrategy_set.slice();
            old_parent.nodestrategy_set.splice(old_parent.nodestrategy_set.indexOf(action.payload.id),1);
            if(old_parent_index==new_parent_index){
                old_parent.nodestrategy_set.splice(new_index,0,action.payload.id);
            }else{
                new_parent.nodestrategy_set = new_parent.nodestrategy_set.slice();
                new_parent.nodestrategy_set.splice(new_index,0,action.payload.id);
                new_state.splice(new_parent_index,1,new_parent);
                
            }
            new_state.splice(old_parent_index,1,old_parent);
            insertedAt(action.payload.id,"nodestrategy",new_parent.id,new_index);
            return new_state;
        case 'node/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].nodestrategy_set.indexOf(action.payload.parent_id)>=0){
                    var new_state=state.slice();
                    new_state[i] = {...new_state[i]};
                    new_state[i].nodestrategy_set = state[i].nodestrategy_set.slice();
                    new_state[i].nodestrategy_set.splice(new_state[i].nodestrategy_set.indexOf(action.payload.parent_id),1);
                    return new_state;
                }
            }
            return state;
        case 'node/insertBelow':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parentID){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]}
                    var new_nodestrategy_set = state[i].nodestrategy_set.slice();
                    new_nodestrategy_set.splice(new_nodestrategy_set.indexOf(action.payload.siblingID)+1,0,action.payload.new_through.id);
                    new_state[i].nodestrategy_set = new_nodestrategy_set;
                    return new_state;
                }
            }
            return state;
        case 'node/newNode':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parentID){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]}
                    var new_nodestrategy_set = state[i].nodestrategy_set.slice();
                    new_nodestrategy_set.splice(action.payload.index,0,action.payload.new_through.id);
                    new_state[i].nodestrategy_set = new_nodestrategy_set;
                    return new_state;
                }
            }
            return state;
        case 'strategy/insertBelow':
            new_state = state.slice();
            new_state.push(action.payload.new_model);
            return new_state;
        case 'strategy/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state.splice(i,1);
                    deleteSelf(action.payload.id,"strategy");
                    return new_state;
                }
            }
            return state;
        case 'strategy/changeField':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]};
                    new_state[i][action.payload.field]=action.payload.value;
                    let json = {};
                    json[action.payload.field]=action.payload.value;
                    if(!read_only)updateValue(action.payload.id,"strategy",json);
                    return new_state;
                }
            }
            return state;
        default:
            return state;
    }
}
export function nodestrategyReducer(state={},action){
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
        case 'strategy/insertBelow':
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
        default:
            return state;
    }
}
export function nodeReducer(state={},action){
    switch(action.type){
        case 'column/deleteSelf':
            var new_state = state.slice();
            var new_columnworkflow;
            if(action.payload.extra_data){
                new_columnworkflow = action.payload.extra_data[0];
                if(new_columnworkflow==action.payload.parent_id)new_columnworkflow=action.payload.extra_data[1];
            }
            
            for(var i=0;i<state.length;i++){
                if(state[i].columnworkflow==action.payload.parent_id){
                    new_state[i]={...state[i]};
                    new_state[i].columnworkflow=new_columnworkflow;
                }
            }
            return new_state;
        case 'node/movedColumnBy':
            var new_state = state.slice();
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    try{
                        let columns = action.payload.columnworkflows;
                        let old_columnworkflow_index = columns.indexOf(state[i].columnworkflow);
                        let new_columnworkflow_index = old_columnworkflow_index+action.payload.delta_x;
                        if(new_columnworkflow_index<0 || new_columnworkflow_index>=columns.length)return state;
                        let new_columnworkflow = columns[new_columnworkflow_index];
                        var new_nodedata = {
                            ...state[i],
                            columnworkflow:new_columnworkflow,
                        };
                        new_state.splice(i,1,new_nodedata);
                        columnChanged(action.payload.id,new_columnworkflow);
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
                    ()=>{Constants.triggerHandlerEach($(".strategy .node"),"component-updated")});
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
        case 'strategy/insertBelow':
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
        default:
            return state;
    }
}