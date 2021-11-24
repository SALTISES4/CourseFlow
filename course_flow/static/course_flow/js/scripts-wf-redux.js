import {Component, createRef} from "react";
import * as reactDom from "react-dom";
import * as Redux from "redux";
import * as React from "react";
import {Provider, connect} from 'react-redux';
import {configureStore, createStore} from '@reduxjs/toolkit';
import {ComponentJSON} from "./ComponentJSON";
import {WorkflowBaseView} from"./WorkflowView";
import {ProjectMenu, WorkflowGridMenu, ExploreMenu, renderMessageBox} from"./MenuComponents";
import {WorkflowView_Outcome} from"./WorkflowView";
import * as Constants from "./Constants";
import * as Reducers from "./Reducers";
import OutcomeTopView from './OutcomeTopView';
import {getWorkflowData, getWorkflowParentData, getWorkflowChildData, updateValue} from './PostFunctions';
import {ConnectionBar} from './ConnectedUsers'
import '../css/base_style.css';
import '../css/workflow_styles.css';

export {Loader} from './Constants';
export {fail_function} from './PostFunctions';

//Manages the current selection, ensuring we only have one at a time
export class SelectionManager{
    constructor(){
        this.currentSelection;
        this.mouse_isclick=false;
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
        if(read_only)return;
        if(evt)evt.stopPropagation();
        if(newSelection && newSelection.props.data && newSelection.props.data.lock)return;
        if(this.currentSelection){
            this.currentSelection.setState({selected:false});
            this.currentSelection.props.renderer.lock_update(
                {object_id:this.currentSelection.props.data.id,
                    object_type:Constants.object_dictionary[this.currentSelection.objectType]
                },60*1000,false
            );
        }
        this.currentSelection=newSelection;
        if(this.currentSelection){
            this.currentSelection.props.renderer.lock_update(
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
        $("#content-container")[0]
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

export class ProjectRenderer{
    constructor(data_package,project_data){
        this.initial_project_data = data_package;
        this.project_data = project_data;
        this.store = createStore(Reducers.projectMenuReducer,data_package);
        this.read_only = data_package.read_only;
    }
    
    render(container){
        this.container=container;
        
        reactDom.render(
        <Provider store = {this.store}>
            <ProjectMenu project={this.project_data}/>
        </Provider>,
        container[0]
    );
        
    }
}


export class WorkflowRenderer{
    constructor(data_package){
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
        this.column_colours = {}
        this.read_only = data_package.read_only;
        if(data_package.project){
            $("#floatbar").append("<a id='project-return' href='"+update_path["project"].replace(0,data_package.project.id)+"' class='floatbardiv'><img src='"+iconpath+"goback.svg'/><div>"+gettext("Project")+"</div></div>");
            let custom_text_base = Constants.custom_text_base();
            for(let i=0;i<data_package.project.terminology_dict.length;i++){
                let term = data_package.project.terminology_dict[i];
                let custom_text = custom_text_base[term.term]
                if(custom_text){
                    if(custom_text["singular_key"])django.catalog[custom_text["singular_key"]]=term.translation;
                    if(custom_text["plural_key"])django.catalog[custom_text["plural_key"]]=term.translation_plural;
                    
                }
            }
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
        this.items_to_load = {
            column:initial_workflow_data.column.filter(x=>!x.deleted).length,
            week:initial_workflow_data.week.filter(x=>!x.deleted).length,
            node:initial_workflow_data.node.filter(x=>!x.deleted).length,
        };
        this.ports_to_render = initial_workflow_data.node.filter(x=>!x.deleted).length;
        
        container.on("component-loaded",(evt,objectType)=>{
            evt.stopPropagation();
            if(objectType&&renderer.items_to_load[objectType]){
                renderer.items_to_load[objectType]--;
                for(let prop in renderer.items_to_load){
                    if(renderer.items_to_load[prop]>0)return;
                }
                renderer.initial_loading=false;
                container.triggerHandler("render-ports");
            }
        });
        
        
        container.on("ports-rendered",(evt)=>{
            evt.stopPropagation();
            renderer.ports_to_render--;
            if(renderer.ports_to_render>0)return;
            renderer.ports_rendered=true;
            container.triggerHandler("render-links");
        });
        
        container.on("render-links",(evt)=>{
           evt.stopPropagation(); 
        });
    
        this.selection_manager = new SelectionManager(); 
        this.selection_manager.renderer = renderer;
        this.tiny_loader = new TinyLoader(container);
        if(view_type=="outcomeedit"){
            //get additional data about parent workflow prior to render
            getWorkflowParentData(workflow_model_id,(response)=>{
                store.dispatch(Reducers.replaceStoreData(response.data_package));
                reactDom.render(
                    <Provider store = {store}>
                        <WorkflowBaseView view_type={view_type} renderer={this}/>
                    </Provider>,
                    container[0]
                );
            });
            
        }else if(view_type=="horizontaloutcometable" || view_type=="alignmentanalysis"){
            //get additional data about child workflows prior to render
            getWorkflowChildData(workflow_model_id,(response)=>{
                store.dispatch(Reducers.replaceStoreData(response.data_package));
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
            reactDom.render(
                <Provider store = {this.store}>
                    <WorkflowBaseView view_type={view_type} renderer={this}/>
                </Provider>,
                container[0]
            );
        }
        
    }
    
    connection_opened(){
        getWorkflowData(workflow_model_id,(response)=>{
            let data_flat = response.data_package;
            this.store = createStore(Reducers.rootWorkflowReducer,data_flat);
            this.render($("#container"));
            this.create_connection_bar();
            this.clear_queue(data_flat.workflow.edit_count);
        });
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
        }
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




export class OutcomeRenderer{
    constructor(data_package){
        this.initial_data = data_package;
        this.store = createStore(Reducers.rootOutcomeReducer,data_package);
    }
    
    
    render(container){
        this.container=container;
        this.selection_manager = new SelectionManager(); 
        this.tiny_loader = new TinyLoader(container);
        reactDom.render(
            <Provider store = {this.store}>
                <OutcomeTopView objectID={this.initial_data.outcome[0].id} renderer={this}/>
            </Provider>,
            container[0]
        );
    }
}

class WorkflowLoader extends React.Component{
    
    render(){
        return (
            <div class="load-screen">
                
            </div>
        
        )
    }
}












