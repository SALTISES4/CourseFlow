import {Component, createRef} from "react";
import * as reactDom from "react-dom";
import * as Redux from "redux";
import * as React from "react";
import {Provider, connect} from 'react-redux';
import {configureStore, createStore} from '@reduxjs/toolkit';
import {ComponentJSON} from "./ComponentJSON.js";
import WorkflowView from"./WorkflowView.js";
import {ProjectMenu, HomeMenu, renderMessageBox} from"./MenuComponents.js";
import {NodeBar} from"./WorkflowView.js";
import * as Constants from "./Constants.js";
import * as Reducers from "./Reducers.js";






//Manages the current selection, ensuring we only have one at a time
export class SelectionManager{
    constructor(){
        this.currentSelection;
        $(document).on("click",this.changeSelection.bind(this))
    }
    
    changeSelection(evt,newSelection){
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
    strategyworkflow:Reducers.strategyworkflowReducer,
    strategy:Reducers.strategyReducer,
    nodestrategy:Reducers.nodestrategyReducer,
    node:Reducers.nodeReducer,
    nodelink:Reducers.nodelinkReducer,
    outcome:Reducers.outcomeReducer,
    outcomeoutcome:Reducers.outcomeOutcomeReducer,
    outcomenode:Reducers.outcomeNodeReducer,
    outcomeproject:Reducers.outcomeProjectReducer,
});

var store;



export function renderWorkflowView(container){
    store = createStore(rootReducer,initial_data);
    reactDom.render(
        <Provider store = {store}>
            <WorkflowView selection_manager={selection_manager}/>
        </Provider>,
        container
    );
}


export function renderHomeMenu(data_package){
    reactDom.render(
        <HomeMenu data_package={data_package}/>,
        $("#content-container")[0]
    );
}



export function renderProjectMenu(data,project){
    reactDom.render(
        <ProjectMenu data_package={data} project={project}/>,
        $("#content-container")[0]
    );
}


