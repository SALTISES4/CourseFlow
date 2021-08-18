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
import {getWorkflowParentData, getWorkflowChildData} from './PostFunctions';
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
        if(this.currentSelection)this.currentSelection.setState({selected:false});
        this.currentSelection=newSelection;
        if(this.currentSelection){
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
        this.initial_workflow_data = data_package.data_flat;
        this.column_choices = data_package.column_choices;
        this.context_choices = data_package.context_choices;
        this.task_choices = data_package.task_choices;
        this.time_choices = data_package.time_choices;
        this.outcome_type_choices = data_package.outcome_type_choices;
        this.outcome_sort_choices = data_package.outcome_sort_choices;
        this.strategy_classification_choices = data_package.strategy_classification_choices;
        this.is_strategy = data_package.is_strategy;
        this.store = createStore(Reducers.rootWorkflowReducer,this.initial_workflow_data);
        this.column_colours = {}
        this.read_only = data_package.read_only;
    }
    
    render(container,view_type="workflowview"){
        console.log("rendering a view");
        this.view_type=view_type;
        reactDom.render(null,container[0]);
        let store = this.store;
        var renderer = this;
        this.initial_loading=true;
        this.container = container;
        this.items_to_load = {
            column:this.initial_workflow_data.column.length,
            week:this.initial_workflow_data.week.length,
            node:this.initial_workflow_data.node.length,
        };
        this.ports_to_render = this.initial_workflow_data.node.length;
        
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
        this.tiny_loader = new TinyLoader(container);
        console.log("view type is "+view_type);
        if(view_type=="outcomeedit"){
            //get additional data about parent workflow prior to render
            getWorkflowParentData(this.initial_workflow_data.workflow.id,(response)=>{
                console.log(response)
                store.dispatch(Reducers.replaceStoreData(response.data_package));
                console.log(store.getState());
                reactDom.render(
                    <Provider store = {store}>
                        <WorkflowBaseView view_type={view_type} renderer={this}/>
                    </Provider>,
                    container[0]
                );
            });
            
        }else if(view_type=="horizontaloutcometable" || view_type=="alignmentanalysis"){
            //get additional data about child workflows prior to render
            getWorkflowChildData(this.initial_workflow_data.workflow.id,(response)=>{
                console.log(response)
                store.dispatch(Reducers.replaceStoreData(response.data_package));
                console.log(store.getState());
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














