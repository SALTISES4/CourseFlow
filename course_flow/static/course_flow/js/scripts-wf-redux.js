// import * as wdyr from './wdyr';
import {Component, createRef} from "react";
import * as reactDom from "react-dom";
import * as Redux from "redux";
import * as React from "react";
import {Provider, connect} from 'react-redux';
import {configureStore, createStore} from '@reduxjs/toolkit';
import {WorkflowBaseView} from "./WorkflowView";
import {ProjectMenu, WorkflowGridMenu, ExploreMenu, renderMessageBox} from "./MenuComponents";
import {WorkflowView_Outcome} from"./WorkflowView";
import {ComparisonView, WorkflowComparisonBaseView} from "./ComparisonView";
import * as Constants from "./Constants";
import * as Reducers from "./Reducers";
import OutcomeTopView from './OutcomeTopView';
import {getTargetProjectMenu, getWorkflowData, getWorkflowParentData, getWorkflowChildData, getPublicWorkflowData, getPublicWorkflowParentData, getPublicWorkflowChildData, updateValue} from './PostFunctions';
import {ConnectionBar} from './ConnectedUsers'
import '../css/base_style.css';
import '../css/workflow_styles.css';

export {Loader} from './Constants';
export {fail_function} from './PostFunctions';

//Manages the current selection, ensuring we only have one at a time
export class SelectionManager{
    constructor(read_only){
        this.currentSelection;
        this.mouse_isclick=false;
        this.read_only=read_only;
        var selector = this;
        $(document).on("mousedown",()=>{
            selector.mouse_isclick=true;
            setTimeout(()=>{selector.mouse_isclick=false;},500);
        });
        $(document).on("mousemove",()=>{
            selector.mouse_isclick=false;
        });
        $(document).on("mouseup",(evt,newSelection)=>{
            if(selector.mouse_isclick){
                selector.changeSelection(evt,null);
            }
        });
        this.last_sidebar_tab = $("#sidebar").tabs( "option", "active");
    }
    
    changeSelection(evt,newSelection){
        if(evt)evt.stopPropagation();
        if(!this.read_only && newSelection && newSelection.props.data && newSelection.props.data.lock)return;
        if(this.currentSelection){
            this.currentSelection.setState({selected:false});
            if(!this.read_only)this.currentSelection.props.renderer.lock_update(
                {object_id:this.currentSelection.props.data.id,
                    object_type:Constants.object_dictionary[this.currentSelection.objectType]
                },60*1000,false
            );
        }
        this.currentSelection=newSelection;
        if(this.currentSelection){
            if(!this.read_only)this.currentSelection.props.renderer.lock_update(
                {object_id:this.currentSelection.props.data.id,
                    object_type:Constants.object_dictionary[this.currentSelection.objectType]
                },60*1000,true
            );
            if($("#sidebar").tabs("option","active")!==0)this.last_sidebar_tab = $("#sidebar").tabs( "option", "active");
            $("#sidebar").tabs("enable",0);
            $("#sidebar").tabs( "option", "active", 0 );
            this.currentSelection.setState({selected:true});
        }else{
            if($("#sidebar").tabs( "option", "active" )===0)$("#sidebar").tabs( "option", "active", this.last_sidebar_tab );
            $("#sidebar").tabs("disable",0);
        }
    }
    
    deleted(selection){
        if(selection==this.currentSelection){
            this.changeSelection(null,null);
        }
    }
}


export function renderExploreMenu(data_package,disciplines){
    reactDom.render(
        <ExploreMenu data_package={data_package} disciplines={disciplines} pages={pages}/>,
        $("#container")[0]
    );
}


export class TinyLoader{
    constructor(identifier){
        this.identifier = identifier; 
        this.loadings = 0;
    }
    
    startLoad(){
        $(this.identifier).addClass('waiting');
        this.loadings++;
    }
        
    endLoad(){
        if(this.loadings>0)this.loadings--;
        if(this.loadings<=0)$(this.identifier).removeClass('waiting');
    }
}

export class HomeRenderer{
    constructor(data_package){
        this.initial_data = data_package;
        this.store = createStore(Reducers.gridMenuReducer,data_package);
    }
    
    render(container){
        this.container = container;
        
        reactDom.render(
            <Provider store = {this.store}>
                <WorkflowGridMenu/>
            </Provider>,
            container[0]
        );
    }
}

// export class ProjectRenderer{
//     constructor(data_package,project_data){
//         this.initial_project_data = data_package;
//         this.project_data = project_data;
//         this.store = createStore(Reducers.projectMenuReducer,data_package);
//         this.read_only = data_package.read_only;
//     }
    
//     render(container){
//         this.container=container;
        
//         reactDom.render(
//         <Provider store = {this.store}>
//             <ProjectMenu project={this.project_data} renderer={this}/>
//         </Provider>,
//         container[0]
//     );
        
//     }
// }


export class WorkflowRenderer{
    constructor(workflowID,data_package){
        this.workflowID=workflowID;
        makeActiveSidebar("#workflow"+this.workflowID);
        this.message_queue=[];
        this.messages_queued=true;
        this.column_choices = data_package.column_choices;
        this.context_choices = data_package.context_choices;
        this.task_choices = data_package.task_choices;
        this.time_choices = data_package.time_choices;
        this.outcome_type_choices = data_package.outcome_type_choices;
        this.outcome_sort_choices = data_package.outcome_sort_choices;
        this.strategy_classification_choices = data_package.strategy_classification_choices;
        this.is_strategy = data_package.is_strategy;
        this.project = data_package.project;
        this.column_colours = {}
        this.user_permission=user_permission;
        if(!this.is_strategy && this.project.object_permission)this.project_permission=this.project.object_permission.permission_type;
        try{
            this.user_role=user_role;
        }catch(err){
            this.user_role=Constants.role_keys["none"];
        }
        this.public_view=public_view;
        this.read_only=true;
        if(this.public_view)this.always_static=true;
        if(this.user_permission==Constants.permission_keys["none"]){
            this.always_static=true;
        }else if(this.user_permission==Constants.permission_keys["view"]){
            this.can_view=true;
        }else if(this.user_permission==Constants.permission_keys["comment"]){
            this.view_comments=true;
            this.add_comments=true;
            this.can_view=true;
        }else if(this.user_permission==Constants.permission_keys["edit"]){
            this.read_only=false;
            this.view_comments=true;
            this.add_comments=true;
            this.can_view=true;
        }
        if(this.user_role==Constants.role_keys["none"]){

        }else if(this.user_role==Constants.role_keys["student"]){
            this.is_student=true;
            this.show_assignments=true;
        }else if(this.user_role==Constants.role_keys["teacher"]){
            this.is_teacher=true;
            this.show_assignments=true;
        }
        if(this.public_view){
            this.getWorkflowData=getPublicWorkflowData;
            this.getWorkflowParentData=getPublicWorkflowParentData;
            this.getWorkflowChildData=getPublicWorkflowChildData;
        }else{
            this.getWorkflowData=getWorkflowData;
            this.getWorkflowParentData=getWorkflowParentData;
            this.getWorkflowChildData=getWorkflowChildData;
        }
        this.is_static=this.always_static;
    }
    
    connect(){
        if(!this.always_static){
            this.messages_queued=true;
            let renderer=this;
            
            let websocket_prefix;
            if (window.location.protocol == "https:") {
               websocket_prefix = "wss";
            }else{
               websocket_prefix = "ws";
            }

            const updateSocket = new WebSocket(
                websocket_prefix+'://'+window.location.host+'/ws/update/'+this.workflowID+'/'
            );
            this.updateSocket = updateSocket;
            
            
            updateSocket.onmessage = function(e){
                this.message_received(e);
            }.bind(this)
            
            let openfunction = function(){
                this.is_static=false;
                this.has_rendered=true;
                this.connection_opened();
            };
            
            updateSocket.onopen = openfunction.bind(this)
            if(updateSocket.readyState==1)openfunction.bind(this)();
            
            updateSocket.onclose = function(e){
                if(e.code==1000)return;
                if(!renderer.has_rendered)renderer.connection_opened(true);
                else{
                    renderer.create_connection_bar();
                    renderer.attempt_reconnect();
                }
                renderer.is_static=true;
                renderer.has_rendered=true;
                if(!renderer.has_disconnected)alert(gettext("Unable to establish connection to the server, or connection has been lost."));
                renderer.has_disconnected=true;
            }
        }else{
            this.connection_opened();
        }
    }
    
    
    render(container,view_type="workflowview"){
        this.view_type=view_type;
        reactDom.render(<WorkflowLoader/>,container[0]);
        let store = this.store;
        let initial_workflow_data = store.getState();
        var renderer = this;
        this.initial_loading=true;
        this.container = container;
        this.locks={}
        let weeks = initial_workflow_data.week.filter(x=>!x.deleted);
        

    
        this.selection_manager = new SelectionManager(this.read_only); 
        this.selection_manager.renderer = renderer;
        this.tiny_loader = new TinyLoader($("body")[0]);
        if(view_type=="outcomeedit"){
            //get additional data about parent workflow prior to render
            this.getWorkflowParentData(this.workflowID,(response)=>{
                store.dispatch(Reducers.refreshStoreData(response.data_package));
                reactDom.render(
                    <Provider store = {store}>
                        <WorkflowBaseView view_type={view_type} renderer={this}/>
                    </Provider>,
                    container[0]
                );
            });
            
        }else if(view_type=="horizontaloutcometable" || view_type=="alignmentanalysis"){
            //get additional data about child workflows prior to render
            this.getWorkflowChildData(this.workflowID,(response)=>{
                store.dispatch(Reducers.refreshStoreData(response.data_package));
                reactDom.render(
                    <Provider store = {store}>
                        <WorkflowBaseView view_type={view_type} renderer={this}/>
                    </Provider>,
                    container[0]
                );
            });
        }else if(view_type=="outcometable") {
            setTimeout(()=>{
                reactDom.render(
                    <Provider store = {this.store}>
                        <WorkflowBaseView view_type={view_type} renderer={this}/>
                    </Provider>,
                    container[0]
                );
            },50);
        }else{
            setTimeout(()=>{
                reactDom.render(
                    <Provider store = {this.store}>
                        <WorkflowBaseView view_type={view_type} renderer={this}/>
                    </Provider>,
                    container[0]
                );
            },50)
        }
        
    }
    
    connection_opened(reconnect=false){
        this.getWorkflowData(this.workflowID,(response)=>{
            let data_flat = response.data_package;
            this.store = createStore(Reducers.rootWorkflowReducer,data_flat);
            this.render($("#container"));
            if(!this.always_static)this.create_connection_bar();
            this.clear_queue(data_flat.workflow.edit_count);
            if(reconnect)this.attempt_reconnect();
        });
    }

    attempt_reconnect(){
        let renderer=this;
        setTimeout(
            ()=>{
                renderer.connect();
            },
           30000
        );
    }
    
    clear_queue(edit_count){
        let started_edits = false;
        while(this.message_queue.length>0){
            let message = this.message_queue[0];
            if(started_edits)this.parsemessage(message);
            else if(message.edit_count && parseInt(message.edit_count)>=edit_count)started_edits=true;
            this.message_queue.splice(0,1);
        }
        this.messages_queued=false;
    }
    
    parsemessage = function(e){
        const data = JSON.parse(e.data);
        if(data.type=="workflow_action"){
            this.store.dispatch(data.action);
        }else if(data.type=="lock_update"){
            this.lock_update_received(data.action);
        }else if(data.type=="connection_update"){
            this.connection_update_received(data.action);
        }else if(data.type=="workflow_parent_updated"){
            this.parent_workflow_updated(data.edit_count);
        }else if(data.type=="workflow_child_updated"){
            this.child_workflow_updated(data.edit_count);
        }
    }

    connection_update_received(){
        console.log("A connection update was received, but not handled");
    }
    
    parent_workflow_updated(edit_count){
        this.messages_queued=true;
        let renderer = this;
        this.getWorkflowParentData(this.workflowID,(response)=>{
            //remove all the parent node and parent workflow data
            renderer.store.dispatch(Reducers.replaceStoreData({parent_node:[],parent_workflow:[]}));
            renderer.store.dispatch(Reducers.refreshStoreData(response.data_package));
            renderer.clear_queue(0);
        });
    }

    child_workflow_updated(edit_count){
        this.messages_queued=true;
        let renderer = this;
        this.getWorkflowChildData(this.workflowID,(response)=>{
            //remove all the child workflow data
            renderer.store.dispatch(Reducers.refreshStoreData(response.data_package));
            renderer.clear_queue(0);
        });
    }
    
    message_received(e){
        if(this.messages_queued)this.message_queue.push(e);
        else this.parsemessage(e);
    }
    
    micro_update(obj){
        if(this.updateSocket){
            this.updateSocket.send(JSON.stringify({type:"micro_update",action:obj}))
        }
    }
    
    change_field(id,object_type,field,value){
        let json = {};
        json[field]=value;
        this.store.dispatch(Reducers.changeField(id,object_type,json));
        updateValue(id,object_type,json,true);
    }
    
    
    lock_update(obj,time,lock){
        if(this.updateSocket){
            this.updateSocket.send(JSON.stringify({type:"lock_update",lock:{...obj,expires:Date.now()+time,user_id:user_id,user_colour:myColour,lock:lock}}));
        }
    }
    
    lock_update_received(data){
        let store = this.store;
        let object_type=data.object_type;
        let object_id=data.object_id;
        if(!this.locks[object_type])this.locks[object_type]={};
        if(this.locks[object_type][object_id]){
            clearTimeout(this.locks[object_type][object_id])
        }
         store.dispatch(Reducers.createLockAction(object_id,object_type,data.lock,data.user_id,data.user_colour));
        if(data.lock)this.locks[object_type][object_id] = setTimeout(function(){
            store.dispatch(Reducers.createLockAction(object_id,object_type,false));
        },data.expires-Date.now());
        else this.locks[object_type][object_id]=null;
       
    }
    
    create_connection_bar(){
        reactDom.render(
            <ConnectionBar updateSocket={this.updateSocket} renderer={this}/>,
            $("#userbar")[0]
        );
    }
    
    
    
}

export class ComparisonRenderer{
    constructor(project_data){
        this.project_data=project_data;
        makeActiveSidebar("#project"+this.project_data.id);
    }
    
    render(container,view_type="workflowview"){
        this.container=container;
        this.view_type=view_type;
        reactDom.render(<WorkflowLoader/>,container[0]);
        var renderer = this;
        this.locks={}
        this.tiny_loader = new TinyLoader($("body")[0]);
        
        if(user_permission==Constants.permission_keys["none"]){
            this.read_only=true;
            this.always_static=true;
        }else if(user_permission==Constants.permission_keys["view"]){
            this.read_only=true;
        }else if(user_permission==Constants.permission_keys["comment"]){
            this.read_only=true;
            this.view_comments=true;
            this.add_comments=true;
        }else if(user_permission==Constants.permission_keys["edit"]){
            this.read_only=false;
            this.view_comments=true;
            this.add_comments=true;
        }
        this.selection_manager = new SelectionManager(this.read_only); 

        if(view_type=="workflowview" || view_type=="outcomeedit"){
            reactDom.render(
                <ComparisonView view_type={view_type} renderer={this} data={this.project_data} selection_manager={this.selection_manager} tiny_loader={this.tiny_loader}/>,
                container[0]
            );
        }
        
    }
    
    create_connection_bar(){
        reactDom.render(
            <ConnectionBar renderer={this}/>,
            $("#userbar")[0]
        );
    }
}

export class WorkflowComparisonRenderer extends WorkflowRenderer{
    constructor(workflowID,data_package,container,selection_manager,tiny_loader,view_type,initial_object_sets){
        super(workflowID,data_package);
        this.selection_manager = selection_manager;
        this.tiny_loader = tiny_loader;
        this.container=container;
        this.view_type=view_type;
        this.initial_object_sets=initial_object_sets;
    }
    
    render(view_type="workflowview"){
        this.view_type=view_type;
        reactDom.render(<WorkflowLoader/>,this.container[0]);
        let store = this.store;
        let initial_workflow_data = store.getState();
        var renderer = this;
        this.locks={}
        
        if(view_type=="outcomeedit"){
            //get additional data about parent workflow prior to render
            this.getWorkflowParentData(this.workflowID,(response)=>{
                store.dispatch(Reducers.refreshStoreData(response.data_package));
                reactDom.render(
                    <Provider store = {store}>
                        <WorkflowComparisonBaseView view_type={view_type} renderer={this}/>
                    </Provider>,
                    this.container[0]
                );
            });
            
        }else if(view_type=="workflowview"){
            reactDom.render(
                <Provider store = {this.store}>
                    <WorkflowComparisonBaseView view_type={view_type} renderer={this}/>
                </Provider>,
                this.container[0]
            );
            
        }
        
    }
    
    
    connection_opened(reconnect=false){
        let loader = new Constants.Loader(this.container[0]);
        this.getWorkflowData(this.workflowID,(response)=>{
            let data_flat = response.data_package;
            if(this.initial_object_sets)data_flat={...data_flat,objectset:this.initial_object_sets};
            this.store = createStore(Reducers.rootWorkflowReducer,data_flat);
            this.render(this.view_type);
            this.create_connection_bar();
            this.clear_queue(data_flat.workflow.edit_count);
            loader.endLoad();
            if(reconnect)this.attempt_reconnect();
        });
    }
    
    
    create_connection_bar(){
        return null;
    }
    
}

//
//
//
//export class OutcomeRenderer{
//    constructor(data_package){
//        this.initial_data = data_package;
//        this.store = createStore(Reducers.rootOutcomeReducer,data_package);
//    }
//    
//    
//    render(container){
//        this.container=container;
//        this.selection_manager = new SelectionManager(this.read_only); 
//        this.tiny_loader = new TinyLoader($("body")[0]);
//        reactDom.render(
//            <Provider store = {this.store}>
//                <OutcomeTopView objectID={this.initial_data.outcome[0].id} renderer={this}/>
//            </Provider>,
//            container[0]
//        );
//    }
//}
//
export class WorkflowLoader extends React.Component{
    
    render(){
        return (
            <div class="load-screen">
                
            </div>
        
        )
    }
}

export function CreateNew(create_url){
    getTargetProjectMenu(-1,(response_data)=>{
        if(response_data.parentID!=null){
            let loader = new Constants.Loader('body');
            window.location=create_url.replace("/0/","/"+response_data.parentID+"/");
        }
    });
}












