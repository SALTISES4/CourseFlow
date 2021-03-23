import * as Redux from "redux";
import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from 'react-redux';
import {configureStore, createStore} from '@reduxjs/toolkit';
import {WorkflowView_Outcome} from "./WorkflowView";
import WorkflowView from "./WorkflowView";
import * as Reducers from "./Reducers.js";


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
        this.column_colours = {}
    }
    
    render(container,outcome_view){
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
            if(objectType&&items_to_load[objectType]){
                items_to_load[objectType]--;
                for(prop in items_to_load){
                    if(items_to_load[prop]>0)return;
                }
                renderer.initial_loading=false;
                container.triggerHandler("render-ports");
            }
        });
        
        
        container.on("ports-rendered",(evt)=>{
            evt.stopPropagation();
            ports_to_render--;
            if(ports_to_render>0)return;
            ports_rendered=true;
            container.triggerHandler("render-links");
        });
        
        container.on("render-links",(evt)=>{
           evt.stopPropagation(); 
        });
    
        this.store = createStore(rootReducer,this.initial_workflow_data);
        this.selection_manager = new workflow_redux.SelectionManager(); 
        this.tiny_loader = new workflow_redux.TinyLoader(container);
        if(outcome_view)reactDom.render(
            <Provider store = {this.store}>
                <WorkflowView_Outcome renderer={this}/>
            </Provider>,
            container[0]
        );
        else reactDom.render(
            <Provider store = {this.store}>
                <WorkflowView renderer={this}/>
            </Provider>,
            container[0]
        );
        
    }
    
}