import {Component, createRef} from "react";
import * as reactDom from "react-dom";
import * as Redux from "redux";
import * as React from "react";
import {Provider, connect} from 'react-redux';
import {configureStore, createStore} from '@reduxjs/toolkit';
import {ComponentJSON} from "./ComponentJSON.js";
import WorkflowView from"./WorkflowView.js";
import {ProjectMenu, HomeMenu, renderMessageBox} from"./MenuComponents.js";
import {NodeBar, WorkflowView_Outcome} from"./WorkflowView.js";
import * as Constants from "./Constants.js";
import * as Reducers from "./Reducers.js";






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
                selector.changeSelection(evt,newSelection);
            }
        });
    }
    
    changeSelection(evt,newSelection){
        console.log(evt);
        if(read_only)return;
        evt.stopPropagation();
        if(this.currentSelection)this.currentSelection.setState({selected:false});
        this.currentSelection=newSelection;
        if(this.currentSelection){
            $("#sidebar").tabs("enable",0);
            if($("#sidebar").tabs( "option", "active" )>0)$("#sidebar").tabs( "option", "active", 0 );
            this.currentSelection.setState({selected:true});
        }else{
            if($("#sidebar").tabs( "option", "active" )===0&& $("#sidebar>ul>li").length>1)$("#sidebar").tabs( "option", "active", 1 );
            $("#sidebar").tabs("disable",0);
        }
    }
}




const rootReducer = Redux.combineReducers({
    workflow:Reducers.workflowReducer,
    columnworkflow:Reducers.columnworkflowReducer,
    column:Reducers.columnReducer,
    weekworkflow:Reducers.weekworkflowReducer,
    week:Reducers.weekReducer,
    nodeweek:Reducers.nodeweekReducer,
    node:Reducers.nodeReducer,
    nodelink:Reducers.nodelinkReducer,
    outcome:Reducers.outcomeReducer,
    outcomeoutcome:Reducers.outcomeOutcomeReducer,
    outcomenode:Reducers.outcomeNodeReducer,
    outcomeproject:Reducers.outcomeProjectReducer,
    strategy:Reducers.strategyReducer,
    saltise_strategy:Reducers.saltiseStrategyReducer,
});

var store;



export function renderWorkflowView(container,outcome_view){
    if(!store)store = createStore(rootReducer,initial_data);
    if(outcome_view)reactDom.render(
        <Provider store = {store}>
            <WorkflowView_Outcome selection_manager={selection_manager}/>
        </Provider>,
        container
    );
    else reactDom.render(
        <Provider store = {store}>
            <WorkflowView selection_manager={selection_manager}/>
        </Provider>,
        container
    );
}


export function renderHomeMenu(data_package){
    if(!store)store = createStore(Reducers.homeMenuReducer,data_package);
    reactDom.render(
        <Provider store = {store}>
            <HomeMenu/>
        </Provider>,
        $("#content-container")[0]
    );
}



export function renderProjectMenu(data_package,project){
    if(!store)store = createStore(Reducers.projectMenuReducer,data_package);
    reactDom.render(
        <Provider store = {store}>
            <ProjectMenu project={project}/>
        </Provider>,
        $("#content-container")[0]
    );
}


