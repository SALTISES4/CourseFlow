import {renderMessageBox} from "./MenuComponents";

export function fail_function(){
    alert("Something went wrong. Please reload the page.")
}

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
        else fail_function();
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
        try{
            $.post(post_paths.update_value, {
                objectID:JSON.stringify(objectID),
                objectType:JSON.stringify(objectType),
                data:JSON.stringify(json)
            }).done(function(data){
                if(data.action == "posted") callBackFunction(data);
                else fail_function();
            });
        }catch(err){
            fail_function();
        }
    }
    document.lastUpdateCallTimer = setTimeout(document.lastUpdateCallFunction,t);
}

export function updateValueInstant(objectID,objectType,json,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.update_value, {
            objectID:JSON.stringify(objectID),
            objectType:JSON.stringify(objectType),
            data:JSON.stringify(json)
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
        });
    }catch(err){
        fail_function();
    }
}

//Add a new column to the workflow 
export function newColumn(workflowPk,column_type,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.new_column, {
            workflowPk:workflowPk,
            column_type:column_type
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
        });
    }catch(err){
        fail_function();
    }
}
    
//Add a new node to a week
export function newNode(weekPk,position=-1,column=-1,column_type=-1,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.new_node, {
            weekPk:JSON.stringify(weekPk),
            position:JSON.stringify(position),
            columnPk:JSON.stringify(column),
            columnType:JSON.stringify(column_type),
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
        });
    }catch(err){
        fail_function();
    }
}
  
//Create a nodelink from the source to the target, at the given ports
export function newNodeLink(source_node,target_node,source_port,target_port,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.new_node_link, {
            nodePk:JSON.stringify(source_node),
            objectID:JSON.stringify(target_node),
            objectType:JSON.stringify("node"),
            sourcePort:JSON.stringify(source_port),
            targetPort:JSON.stringify(target_port),

        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
        });
    }catch(err){
        fail_function();
    }
}  

//Add a strategy to the workflow
export function addStrategy(workflowPk,position=-1,strategyPk=-1,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.add_strategy, {
            workflowPk:JSON.stringify(workflowPk),
            position:JSON.stringify(position),
            strategyPk:JSON.stringify(strategyPk),
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
        });
    }catch(err){
        fail_function();
    }
}
//Turn a week into a strategy or vice versa
export function toggleStrategy(weekPk,is_strategy,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.toggle_strategy, {
            weekPk:JSON.stringify(weekPk),
            is_strategy:JSON.stringify(is_strategy),
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
        });
    }catch(err){
        fail_function();
    }
}

//Causes the specified object to delete itself
export function deleteSelf(objectID,objectType,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.delete_self, {
            objectID:JSON.stringify(objectID),
            objectType:JSON.stringify(objectType)
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
        });
    }catch(err){
        fail_function();
    }
}

//Causes the specified throughmodel to delete itself
export function unlinkOutcomeFromNode(nodeID,outcomeID,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.unlink_outcome_from_node, {
            nodePk:JSON.stringify(nodeID),
            outcomePk:JSON.stringify(outcomeID)
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
        });
    }catch(err){
        fail_function();
    }
}

//Causes the specified throughmodel to update its degree
export function updateOutcomenodeDegree(nodeID,outcomeID,value,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.update_outcomenode_degree, {
            nodePk:JSON.stringify(nodeID),
            outcomePk:JSON.stringify(outcomeID),
            degree:JSON.stringify(value)
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
        });
    }catch(err){
        fail_function();
    }
}

//Causes the specified object to insert a sibling after itself
export function duplicateSelf(objectID,objectType,parentID,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.duplicate_self, {
            parentID:JSON.stringify(parentID),
            objectID:JSON.stringify(objectID),
            objectType:JSON.stringify(objectType),
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
        });
    }catch(err){
        fail_function();
    }
}
//Causes the specified object to insert a sibling after itself
export function insertSibling(objectID,objectType,parentID,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.insert_sibling, {
            parentID:JSON.stringify(parentID),
            objectID:JSON.stringify(objectID),
            objectType:JSON.stringify(objectType),
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
        });
    }catch(err){
        fail_function();
    }
}

//Causes the specified object to insert a child to itself
export function insertChild(objectID,objectType,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.insert_child, {
            objectID:JSON.stringify(objectID),
            objectType:JSON.stringify(objectType),
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
        });
    }catch(err){
        fail_function();
    }
}
    
//Called when an object in a list is reordered
export function insertedAt(objectID,objectType,parentID,newPosition,callBackFunction=()=>console.log("success")){
    
    $(document).off(objectType+"-dropped.insert");
    $(document).on(objectType+"-dropped.insert",()=>{
        try{
            $.post(post_paths.inserted_at, {
                objectID:JSON.stringify(objectID),
                objectType:JSON.stringify(objectType),
                parentID:JSON.stringify(parentID),
                newPosition:JSON.stringify(newPosition),
            }).done(function(data){
                if(data.action == "posted") callBackFunction(data);
                else fail_function();
            });
        }catch(err){
            fail_function();
        }
    });
}
 
//Called when a node should have its column changed
export function columnChanged(objectID,columnID,callBackFunction=()=>console.log("success")){
    
    $(document).off("nodeweek-dropped.columnchange");
    $(document).on("nodeweek-dropped.columnchange",()=>{
        try{
    
            $.post(post_paths.column_changed, {
                nodePk:JSON.stringify(objectID),
                columnPk:JSON.stringify(columnID),
            }).done(function(data){
                if(data.action == "posted") callBackFunction(data);
                else fail_function();
            });
        }catch(err){
            fail_function();
        }
    });
}


//Add an outcome to a node
export function addOutcomeToNode(nodePk,outcome,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.add_outcome_to_node, {
            nodePk:JSON.stringify(nodePk),
            outcomePk:JSON.stringify(outcome),
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
        });
    }catch(err){
        fail_function();
    }
}


//Duplicate a project workflow, strategy, or outcome
export function duplicateBaseItem(itemPk,objectType,projectID,callBackFunction=()=>console.log("success")){
    try{
        if(objectType=="project"){
            $.post(post_paths.duplicate_project_ajax, {
                projectPk:JSON.stringify(itemPk),
            }).done(function(data){
                if(data.action == "posted") callBackFunction(data);
                else fail_function();
            });
        }else if(objectType=="outcome"){
            $.post(post_paths.duplicate_outcome_ajax, {
                outcomePk:JSON.stringify(itemPk),
                projectPk:JSON.stringify(projectID),
            }).done(function(data){
                if(data.action == "posted") callBackFunction(data);
                else fail_function();
            });
        }else if(!projectID && projectID!==0){
            $.post(post_paths.duplicate_strategy_ajax, {
                workflowPk:JSON.stringify(itemPk),
            }).done(function(data){
                if(data.action == "posted") callBackFunction(data);
                else fail_function();
            });
        }else{
            $.post(post_paths.duplicate_workflow_ajax, {
                workflowPk:JSON.stringify(itemPk),
                projectPk:JSON.stringify(projectID),
            }).done(function(data){
                if(data.action == "posted") callBackFunction(data);
                else fail_function();
            });
        }
    }catch(err){
        fail_function();
    }

    
    
}
