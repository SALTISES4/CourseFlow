import {renderMessageBox} from "./MenuComponents";

export function getLinkedWorkflowMenu(nodeData,updateFunction){
    $.post(post_paths.get_possible_linked_workflows,{
        nodePk:JSON.stringify(nodeData.id),
    },(data)=>openLinkedWorkflowMenu(data,updateFunction));
}

export function openLinkedWorkflowMenu(response,updateFunction){
    if(response.action=="posted"){
        renderMessageBox(response,"linked_workflow_menu",updateFunction);
    }else alert("Failed to find the parent project. Is this workflow in a project?");
}

export function setLinkedWorkflow(node_id, workflow_id,callBackFunction=()=>console.log("success")){
    $.post(post_paths.set_linked_workflow, {
        nodePk:node_id,
        workflowPk:workflow_id,
    }).done(function(data){
        if(data.action == "posted") callBackFunction(data);
        else console.log("Failed");
    });
}

export function updateValue(objectID,objectType,json,callBackFunction=()=>console.log("success")){
    var t = 1000;
    let previousCall = document.lastUpdateCall;
    document.lastUpdateCall = {time:Date.now(),id:objectID,type:objectType,field:Object.keys(json)[0]};
    
    if(previousCall && ((document.lastUpdateCall.time-previousCall.time)<=t)){
        clearTimeout(document.lastUpdateCallTimer);
    }
    if(previousCall && (previousCall.id!=document.lastUpdateCall.id || previousCall.type!=document.lastUpdateCall.type ||previousCall.field!=document.lastUpdateCall.field)){
       document.lastUpdateCallFunction();
    }
    document.lastUpdateCallFunction = ()=>{
        $.post(post_paths.update_value, {
            objectID:JSON.stringify(objectID),
            objectType:JSON.stringify(objectType),
            data:JSON.stringify(json)
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else console.log("Failed");
        });
    }
    document.lastUpdateCallTimer = setTimeout(document.lastUpdateCallFunction,t);
}

export function updateValueInstant(objectID,objectType,json,callBackFunction=()=>console.log("success")){
    $.post(post_paths.update_value, {
        objectID:JSON.stringify(objectID),
        objectType:JSON.stringify(objectType),
        data:JSON.stringify(json)
    }).done(function(data){
        if(data.action == "posted") callBackFunction(data);
        else console.log("Failed");
    });
}

//Add a new column to the workflow 
export function newColumn(workflowPk,column_type,callBackFunction=()=>console.log("success")){
    $.post(post_paths.new_column, {
        workflowPk:workflowPk,
        column_type:column_type
    }).done(function(data){
        if(data.action == "posted") callBackFunction(data);
        else console.log("Failed");
    });
}
    
//Add a new node to a strategy
export function newNode(strategyPk,position=-1,column=-1,column_type=-1,callBackFunction=()=>console.log("success")){
    $.post(post_paths.new_node, {
        strategyPk:JSON.stringify(strategyPk),
        position:JSON.stringify(position),
        columnPk:JSON.stringify(column),
        columnType:JSON.stringify(column_type),
    }).done(function(data){
        if(data.action == "posted") callBackFunction(data);
        else console.log("Failed");
    });
}
  
//Create a nodelink from the source to the target, at the given ports
export function newNodeLink(source_node,target_node,source_port,target_port,callBackFunction=()=>console.log("success")){
    $.post(post_paths.new_node_link, {
        nodePk:JSON.stringify(source_node),
        targetID:JSON.stringify(target_node),
        sourcePort:JSON.stringify(source_port),
        targetPort:JSON.stringify(target_port),
        
    }).done(function(data){
        if(data.action == "posted") callBackFunction(data);
        else console.log("Failed");
    });
}  

//Causes the specified object to delete itself
export function deleteSelf(objectID,objectType,callBackFunction=()=>console.log("success")){
    $.post(post_paths.delete_self, {
        objectID:JSON.stringify(objectID),
        objectType:JSON.stringify(objectType)
    }).done(function(data){
        if(data.action == "posted") callBackFunction(data);
        else console.log("Failed");
    });
}

//Causes the specified throughmodel to delete itself
export function unlinkOutcomeFromNode(objectID,objectType,callBackFunction=()=>console.log("success")){
    $.post(post_paths.unlink_outcome_from_node, {
        objectID:JSON.stringify(objectID),
        objectType:JSON.stringify(objectType)
    }).done(function(data){
        if(data.action == "posted") callBackFunction(data);
        else console.log("Failed");
    });
}

//Causes the specified object to insert a sibling after itself
export function duplicateSelf(objectID,objectType,parentID,callBackFunction=()=>console.log("success")){
    $.post(post_paths.duplicate_self, {
        parentID:JSON.stringify(parentID),
        objectID:JSON.stringify(objectID),
        objectType:JSON.stringify(objectType),
    }).done(function(data){
        if(data.action == "posted") callBackFunction(data);
        else console.log("Failed");
    });
}
//Causes the specified object to insert a sibling after itself
export function insertSibling(objectID,objectType,parentID,callBackFunction=()=>console.log("success")){
    $.post(post_paths.insert_sibling, {
        parentID:JSON.stringify(parentID),
        objectID:JSON.stringify(objectID),
        objectType:JSON.stringify(objectType),
    }).done(function(data){
        if(data.action == "posted") callBackFunction(data);
        else console.log("Failed");
    });
}

    
//Called when an object in a list is reordered
export function insertedAt(objectID,objectType,parentID,newPosition,callBackFunction=()=>console.log("success")){
    
    $(document).off(objectType+"-dropped.insert");
    $(document).on(objectType+"-dropped.insert",()=>{
        $.post(post_paths.inserted_at, {
            objectID:JSON.stringify(objectID),
            objectType:JSON.stringify(objectType),
            parentID:JSON.stringify(parentID),
            newPosition:JSON.stringify(newPosition),
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else console.log("Failed");
        });
    });
}
 
//Called when a node should have its column changed
export function columnChanged(objectID,columnID,callBackFunction=()=>console.log("success")){
    
    $(document).off("nodestrategy-dropped.columnchange");
    $(document).on("nodestrategy-dropped.columnchange",()=>{
    
        $.post(post_paths.column_changed, {
            nodePk:JSON.stringify(objectID),
            columnID:JSON.stringify(columnID),
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else console.log("Failed");
        });
    });
}


//Add an outcome to a node
export function addOutcomeToNode(nodePk,outcome,callBackFunction=()=>console.log("success")){
    $.post(post_paths.add_outcome_to_node, {
        nodePk:JSON.stringify(nodePk),
        outcomePk:JSON.stringify(outcome),
    }).done(function(data){
        if(data.action == "posted") callBackFunction(data);
        else console.log("Failed");
    });
}