import {renderMessageBox} from "./MenuComponents";

export function fail_function(){
    alert("Something went wrong. Please reload the page.")
}

export function getAddedWorkflowMenu(projectPk,type_filter,get_strategies,updateFunction){
    $.post(post_paths.get_possible_added_workflows,{
        projectPk:JSON.stringify(projectPk),
        type_filter:JSON.stringify(type_filter),
        get_strategies:JSON.stringify(get_strategies),
    },(data)=>openAddedWorkflowMenu(data,updateFunction));
}

export function getLinkedWorkflowMenu(nodeData,updateFunction){
    $.post(post_paths.get_possible_linked_workflows,{
        nodePk:JSON.stringify(nodeData.id),
    },(data)=>openLinkedWorkflowMenu(data,updateFunction));
}

export function getTargetProjectMenu(workflowPk,updateFunction){
    $.post(post_paths.get_target_projects,{
        workflowPk:JSON.stringify(workflowPk)
    },(data)=>openTargetProjectMenu(data,updateFunction));
}

export function openLinkedWorkflowMenu(response,updateFunction){
    if(response.action=="posted"){
        renderMessageBox(response,"linked_workflow_menu",updateFunction);
    }else alert("Failed to find the parent project. Is this workflow in a project?");
}

export function openAddedWorkflowMenu(response,updateFunction){
    if(response.action=="posted"){
        renderMessageBox(response,"added_workflow_menu",updateFunction);
    }else alert("Failed to find your workflows.");
}

export function openTargetProjectMenu(response,updateFunction){
    if(response.action=="posted"){
        renderMessageBox(response,"target_project_menu",updateFunction);
    }else alert("Failed to find potential projects.");
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

export function updateValue(objectID,objectType,json,changeField=false,callBackFunction=()=>console.log("success")){
    var t = 1000;
    let previousCall = document.lastUpdateCall;
    document.lastUpdateCall = {time:Date.now(),id:objectID,type:objectType,field:Object.keys(json)[0]};
    
    if(previousCall && ((document.lastUpdateCall.time-previousCall.time)<=t)){
        clearTimeout(document.lastUpdateCallTimer);
    }
    if(previousCall && (previousCall.id!=document.lastUpdateCall.id || previousCall.type!=document.lastUpdateCall.type ||previousCall.field!=document.lastUpdateCall.field)){
       document.lastUpdateCallFunction();
    }
    let post_object = {
        objectID:JSON.stringify(objectID),
        objectType:JSON.stringify(objectType),
        data:JSON.stringify(json)
    }
    if(changeField)post_object.changeFieldID = changeFieldID;
    else post_object.changeFieldID=0;
    document.lastUpdateCallFunction = ()=>{
        try{
            $.post(post_paths.update_value, post_object).done(function(data){
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

    
//Add a new outcome to a workflow
export function newOutcome(workflowPk,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.new_outcome, {
            workflowPk:JSON.stringify(workflowPk),
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
            objectID:JSON.stringify(strategyPk),
            objectType:JSON.stringify("workflow"),
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
export function deleteSelf(objectID,objectType,soft=false,callBackFunction=()=>console.log("success")){
    let path;
    if(soft)path=post_paths.delete_self_soft;
    else path=post_paths.delete_self;
    try{
        $.post(path, {
            objectID:JSON.stringify(objectID),
            objectType:JSON.stringify(objectType)
        }).done(function(data){
            console.log(data);
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
        });
    }catch(err){
        console.log(err);
        fail_function();
    }
}

//Causes the specified object to undelete itself
export function restoreSelf(objectID,objectType,callBackFunction=()=>console.log("success")){
    let path;
    try{
        $.post(post_paths.restore_self, {
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

//Removes the specified comment from the object
export function removeComment(objectID,objectType,commentPk,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.remove_comment, {
            objectID:JSON.stringify(objectID),
            commentPk:JSON.stringify(commentPk),
            objectType:JSON.stringify(objectType)
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
export function duplicateSelf(objectID,objectType,parentID,parentType,throughType,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.duplicate_self, {
            parentID:JSON.stringify(parentID),
            parentType:JSON.stringify(parentType),
            objectID:JSON.stringify(objectID),
            objectType:JSON.stringify(objectType),
            throughType:JSON.stringify(throughType)
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
        });
    }catch(err){
        fail_function();
    }
}
//Causes the specified object to insert a sibling after itself
export function insertSibling(objectID,objectType,parentID,parentType,throughType,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.insert_sibling, {
            parentID:JSON.stringify(parentID),
            parentType:JSON.stringify(parentType),
            objectID:JSON.stringify(objectID),
            objectType:JSON.stringify(objectType),
            throughType:JSON.stringify(throughType)
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


//Called when a node should have its column changed
export function columnChanged(renderer,objectID,columnID){
    if(!renderer.dragAction)renderer.dragAction={};
    if(!renderer.dragAction["nodeweek"])renderer.dragAction["nodeweek"]={};
    renderer.dragAction["nodeweek"] = {
        ...renderer.dragAction["nodeweek"],
        objectID:JSON.stringify(objectID),
        objectType:JSON.stringify("node"),
        columnPk:JSON.stringify(columnID),
        columnChange:JSON.stringify(true),
    }
    $(document).off("nodeweek-dropped");
    $(document).on("nodeweek-dropped",()=>{
        dragAction(renderer.dragAction["nodeweek"]);
        renderer.dragAction["nodeweek"]=null;
        $(document).off("nodeweek-dropped");
    });
}

//Called when an object in a list is reordered
export function insertedAt(renderer,objectID,objectType,parentID,parentType,newPosition,throughType){
    if(!renderer.dragAction)renderer.dragAction={};
    if(!renderer.dragAction[throughType])renderer.dragAction[throughType]={};
    renderer.dragAction[throughType]={
        ...renderer.dragAction[throughType],
        objectID:JSON.stringify(objectID),
        objectType:JSON.stringify(objectType),
        parentID:JSON.stringify(parentID),
        parentType:JSON.stringify(parentType),
        newPosition:JSON.stringify(newPosition),
        throughType:JSON.stringify(throughType),
        inserted:JSON.stringify(true),
    }
    $(document).off(throughType+"-dropped");
    $(document).on(throughType+"-dropped",()=>{
        dragAction(renderer.dragAction[throughType]);
        renderer.dragAction[throughType]=null;
        $(document).off(throughType+"-dropped");
    });
}



export function dragAction(action_data,callBackFunction=()=>console.log("success")){
    try{
        workflow_renderer.tiny_loader.startLoad();
        $(".ui-draggable").draggable("disable");
        $.post(post_paths.inserted_at, 
            action_data
        ).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
            $(".ui-draggable").draggable("enable");
            workflow_renderer.tiny_loader.endLoad();
        });
    }catch(err){
        fail_function();
    }
}


//Add an outcome from the parent workflow to an outcome from the current one
export function updateOutcomehorizontallinkDegree(outcomePk,outcome2Pk,degree,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.update_outcomehorizontallink_degree, {
            outcomePk:JSON.stringify(outcomePk),
            objectID:JSON.stringify(outcome2Pk),
            objectType:JSON.stringify("outcome"),
            degree:JSON.stringify(degree),
        }).done(function(data){
            if(data.action == "posted") callBackFunction(data);
            else fail_function();
        });
    }catch(err){
        fail_function();
    }
}

//Add an outcome to a node
export function toggleFavourite(objectID,objectType,favourite,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.toggle_favourite, {
            objectID:JSON.stringify(objectID),
            objectType:JSON.stringify(objectType),
            favourite:JSON.stringify(favourite),
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

//Get the data from the workflow
export function getWorkflowData(workflowPk,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.get_workflow_data,{
            workflowPk:JSON.stringify(workflowPk)
        }).done(function(data){
            callBackFunction(data);
        });
    }catch(err){
        fail_function();
    }
}

//Get the data from all parent workflows
export function getWorkflowParentData(workflowPk,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.get_workflow_parent_data,{
            workflowPk:JSON.stringify(workflowPk)
        }).done(function(data){
            callBackFunction(data);
        });
    }catch(err){
        fail_function();
    }
}

//Get the data from all child workflows
export function getWorkflowChildData(workflowPk,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.get_workflow_child_data,{
            workflowPk:JSON.stringify(workflowPk)
        }).done(function(data){
            callBackFunction(data);
        });
    }catch(err){
        fail_function();
    }
}

//Get the list of possible disciplines
export function getDisciplines(callBackFunction=()=>console.log("success")){
    try{
        $.get(get_paths.get_disciplines).done(function(data){
            callBackFunction(data);
        });
    }catch(err){
        fail_function();
    }
}

//set the permission for a user
export function setUserPermission(user_id,objectID,objectType,permission_type,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.set_permission,{
            objectID:JSON.stringify(objectID),
            objectType:JSON.stringify(objectType),
            permission_user:JSON.stringify(user_id),
            permission_type:JSON.stringify(permission_type)
        }).done(function(data){
            callBackFunction(data);
        });
    }catch(err){
        fail_function();
    }
}

//Get the list of users for a project
export function getUsersForObject(objectID,objectType,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.get_users_for_object,{
            objectID:JSON.stringify(objectID),
            objectType:JSON.stringify(objectType)
        }).done(function(data){
            callBackFunction(data);
        });
    }catch(err){
        fail_function();
    }
}

//Get a list of users, filtered by name
export function getUserList(filter,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.get_user_list,{filter:JSON.stringify(filter)}).done(function(data){
            callBackFunction(data);
        });
    }catch(err){
        fail_function();
    }
}

//Get the comments for a particular object
export function getCommentsForObject(objectID,objectType,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.get_comments_for_object,{
            objectID:JSON.stringify(objectID),
            objectType:JSON.stringify(objectType),
        }).done(function(data){
            callBackFunction(data);
        });
    }catch(err){
        fail_function();
    }
}

//add a comment to an object
export function addComment(objectID,objectType,text,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.add_comment,{
            objectID:JSON.stringify(objectID),
            objectType:JSON.stringify(objectType),
            text:JSON.stringify(text),
        }).done(function(data){
            callBackFunction(data);
        });
    }catch(err){
        fail_function();
    }
}

//add a comment to an object
export function addTerminology(projectPk,term,translation,translation_plural,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.add_terminology,{
            projectPk:JSON.stringify(projectPk),
            term:JSON.stringify(term),
            translation:JSON.stringify(translation),
            translation_plural:JSON.stringify(translation_plural),
        }).done(function(data){
            callBackFunction(data);
        });
    }catch(err){
        fail_function();
    }
}


//Get the info from the parent workflow
export function getParentWorkflowInfo(workflowPk,callBackFunction=()=>console.log("success")){
    try{
        $.post(post_paths.get_parent_workflow_info,{
            workflowPk:JSON.stringify(workflowPk),
        }).done(function(data){
            callBackFunction(data);
        });
    }catch(err){
        fail_function();
    }
}

//get exported data
//export function getExport(objectID,objectType,exportType,callBackFunction=()=>console.log("success")){
//    try{
//        $.post(post_paths.get_export,{
//            objectID:JSON.stringify(objectID),
//            objectType:JSON.stringify(objectType),
//            exportType:JSON.stringify(exportType),
//        }).done(function(data, status, xhr){
//            callBackFunction(data);
//        });
//    }catch(err){
//        fail_function();
//    }
//}

//get exported data
export function getExport(objectID,objectType,exportType,callBackFunction=()=>console.log("success")){
    try{
        let a=document.createElement('a');
        document.body.append(a);
        a.href=get_paths.get_download_export.replace('0',objectID).replace('objecttype',objectType).replace('exporttype',exportType);
        a.click();
    }catch(err){
        fail_function();
    }
}

