import {Component, createRef} from "react";
import * as reactDom from "react-dom";
import * as Redux from "redux";
import * as React from "react";
//import * as preactContext from 'preact-context';
//import {createPortal} from "preact/compat";
import {Decimal} from 'decimal.js/decimal';
import {Provider, connect} from 'react-redux';
import {configureStore, createStore} from '@reduxjs/toolkit';
let amount = new Decimal(0.00);
import {dot as mathdot, subtract as mathsubtract, matrix as mathmatrix, add as mathadd, multiply as mathmultiply, norm as mathnorm, isNaN as mathisnan} from "mathjs";



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
            this.currentSelection.setState({selected:true});
            $("#node-bar-container").css("display","none");
        }else $("#node-bar-container").css("display","revert");
    }

}



const setInitialState = workflow => {
    return {
        type: 'workflow/setInitialState',
        payload:workflow
    }
}

function workflowReducer(state={},action){
    if(action.type=='workflow/setInitialState'){
        console.log(state);
        console.log(action);
        return action.payload
    }
    
    return state;
}

const rootReducer = Redux.combineReducers({
    workflow:workflowReducer,
});

const store = createStore(rootReducer);



//Extends the react component to add a few features that are used in a large number of components
export class ComponentJSON extends Component{
    
}

//Basic component representing a column
export class ColumnView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="column";
        this.objectClass=".column";
    }
    
    render(){
        let data = this.props.data;
        var title = data.title;
        if(!title)title=data.column_type_display;
        return (
            <div class={"column"+((this.state.selected && " selected")||"")} onClick={(evt)=>selection_manager.changeSelection(evt,this)}>
                {title}
            </div>
        );
    }
}
const mapColumnStateToProps = state=>({
    data:state.workflow
})
const mapColumnDispatchToProps = {};
export const ColumnViewConnected = connect(
    mapColumnStateToProps,
    null
)(ColumnView)

//Basic component to represent a columnworkflow
export class ColumnWorkflowView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="columnworkflow";
        this.objectClass=".column-workflow";
    }
    
    render(){
        let data = this.props.data;
        return (
            <div class={"column-workflow column-"+this.state.id} ref={this.maindiv}>
                <ColumnViewConnected objectID={this.state.column}/>
            </div>
        )
    }
}
const mapColumnWorkflowStateToProps = state=>({
    data:state.workflow
})
const mapColumnWorkflowDispatchToProps = {};
export const ColumnWorkflowViewConnected = connect(
    mapColumnWorkflowStateToProps,
    null
)(ColumnWorkflowView)

//Basic component representing the workflow
export class WorkflowView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.nodebar = createRef();
    }
    
    render(){
        let data = this.props.data;
        var columnworkflows = data.columnworkflow_set.map((columnworkflow)=>
            <ColumnWorkflowViewConnected key={columnworkflow} objectID={columnworkflow}/>
        );
        /*var strategyworkflows = data.strategyworkflow_set.map((strategyworkflow)=>
            <StrategyWorkflowViewConnected key={strategyworkflow} objectID={strategyworkflow}/>
        );*/
        
        return(
            <div id="workflow-wrapper" class="workflow-wrapper">
                <div class = "workflow-container">
                    <div class="workflow-details">
                        {columnworkflows}
                    </div>
                </div>
            </div>
        );
    }
}
const mapWorkflowStateToProps = state=>({
    data:state.workflow
})
const mapWorkflowDispatchToProps = {};
export const WorkflowViewConnected = connect(
    mapWorkflowStateToProps,
    null
)(WorkflowView)


export function renderWorkflowView(workflow,container){
    console.log(store);
    store.dispatch(setInitialState(workflow));
    console.log(store.getState());
    reactDom.render(
        <Provider store = {store}>
            <WorkflowViewConnected/>
        </Provider>,
        container
    );
}





