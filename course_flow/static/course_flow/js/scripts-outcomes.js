import {Component, createRef} from "react";
import * as reactDom from "react-dom";
import * as Redux from "redux";
import * as React from "react";
import {Provider, connect} from 'react-redux';
import {configureStore, createStore} from '@reduxjs/toolkit';
import {WorkflowForMenu} from './MenuComponents.js'
import {ComponentJSON, TitleText} from './ComponentJSON';

const moveOutcomeOutcome = (id,new_position,new_parent) => {
    return {
        type: 'outcomeoutcome/movedTo',
        payload:{id:id,new_index:new_position,new_parent:new_parent}
    }
}

const changeField = (id,objectType,field,value) => {
    return {
        type: objectType+'/changeField',
        payload:{id:id,field:field,value:value}
    }
}

function outcomeReducer(state={},action){
    console.log(action);
    switch(action.type){
        case 'outcomeoutcome/movedTo':
            let old_parent, old_parent_index,new_parent,new_parent_index;
            for(var i=0;i<state.length;i++){
                if(state[i].child_outcome_links.indexOf(action.payload.id)>=0){
                    old_parent_index=i;
                    old_parent={...state[i]};
                }
                if(state[i].id==action.payload.new_parent){
                    new_parent_index=i;
                    new_parent={...state[i]};
                }
            }
            var new_index = action.payload.new_index;
            var new_state = state.slice();
            old_parent.child_outcome_links = old_parent.child_outcome_links.slice();
            old_parent.child_outcome_links.splice(old_parent.child_outcome_links.indexOf(action.payload.id),1);
            if(old_parent_index==new_parent_index){
                old_parent.child_outcome_links.splice(new_index,0,action.payload.id);
            }else{
                new_parent.child_outcome_links = new_parent.child_outcome_links.slice();
                new_parent.child_outcome_links.splice(new_index,0,action.payload.id);
                new_state.splice(new_parent_index,1,new_parent);
            }
            new_state.splice(old_parent_index,1,old_parent);
            insertedAt(action.payload.id,"outcomeoutcome",new_parent.id,new_index);
            return new_state;
        case 'outcome/deleteSelf':
            var new_state=state.slice();
            for(var i=0;i<state.length;i++){
                if(state[i].child_outcome_links.indexOf(action.payload.parent_id)>=0){
                    new_state[i] = {...new_state[i]};
                    new_state[i].child_outcome_links = state[i].child_outcome_links.slice();
                    new_state[i].child_outcome_links.splice(new_state[i].child_outcome_links.indexOf(action.payload.parent_id),1);
                }else if(state[i].id==action.payload.id){
                    new_state.splice(i,1);
                    deleteSelf(action.payload.id,"outcome");
                }
            }
            return new_state;
        case 'outcome/insertChild':
        case 'outcome/insertBelow':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parentID){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]}
                    var new_child_outcome_links = state[i].child_outcome_links.slice();
                    let new_index;
                    if(action.payload.siblingID===undefined)new_index=new_child_outcome_links.length;
                    else new_index= new_child_outcome_links.indexOf(action.payload.siblingID)+1;
                    new_child_outcome_links.splice(new_index,0,action.payload.new_through.id);
                    new_state[i].child_outcome_links = new_child_outcome_links;
                    new_state.push(action.payload.new_model);
                    if(action.payload.children){
                        for(var i=0;i<action.payload.children.length;i++){
                            new_state.push(action.payload.children[i]);
                        }
                    }
                    console.log(new_state);
                    return new_state;
                }
            }
            return state;
        case 'outcome/changeField':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]};
                    new_state[i][action.payload.field]=action.payload.value;
                    let json = {};
                    json[action.payload.field]=action.payload.value;
                    if(!read_only)updateValue(action.payload.id,"outcome",json);
                    return new_state;
                }
            }
            return state;
        default:
            return state;
    }
}

function outcomeOutcomeReducer(state={},action){
    console.log(action);
    switch(action.type){
        case 'outcome/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parent_id){
                    var new_state=state.slice();
                    new_state.splice(i,1);
                    return new_state;
                }
            }
            return state;
        case 'outcome/insertChild':
        case 'outcome/insertBelow':
            var new_state = state.slice();
            new_state.push(action.payload.new_through);
            if(action.payload.children_through){
                for(var i=0;i<action.payload.children_through.length;i++){
                    new_state.push(action.payload.children_through[i]);
                }
            }
            return new_state;
        default:
            return state;
    }
}
const rootReducer = Redux.combineReducers({
    outcome:outcomeReducer,
    outcomeoutcome:outcomeOutcomeReducer,
});

var store;

const getOutcomeByID = (state,id)=>{
    for(var i in state.outcome){
        var outcome = state.outcome[i];
        if(outcome.id==id)return {data:outcome};
    }
}

const getOutcomeOutcomeByID = (state,id)=>{
    for(var i in state.outcomeoutcome){
        var outcomeoutcome = state.outcomeoutcome[i];
        if(outcomeoutcome.id==id)return {data:outcomeoutcome};
    }
}

//Basic component representing an outcome to outcome link
export class OutcomeOutcomeView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcomeoutcome";
    }
    
    render(){
        let data = this.props.data;
        var selector = this;
        
        let titleText = data.title;
        
        return (
            <div class="outcome-outcome" id={data.id} ref={this.maindiv}>
                <OutcomeViewConnected objectID={data.child} parentID={this.props.parentID} throughParentID={data.id}/>
            </div>
        );
    }
    
}
const mapOutcomeOutcomeStateToProps = (state,own_props)=>(
    getOutcomeOutcomeByID(state,own_props.objectID)
)
export const OutcomeOutcomeViewConnected = connect(
    mapOutcomeOutcomeStateToProps,
    null
)(OutcomeOutcomeView)

//Basic component representing an outcome
export class OutcomeView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcome";
        this.children_block = createRef();
    }
    
    render(){
        let data = this.props.data;
        var selector = this;
        
        var children = data.child_outcome_links.map((outcomeoutcome)=>
            <OutcomeOutcomeViewConnected key={outcomeoutcome} objectID={outcomeoutcome} parentID={data.id}/>
        );
        
        let actions=[this.addInsertChild(data)];
        if(data.depth>0){
            actions.push(this.addInsertSibling(data));
            actions.push(this.addDuplicateSelf(data));
            actions.push(this.addDeleteSelf(data));
        }
        
        let dropIcon;
        if(data.is_dropped)dropIcon = "droptriangleup";
        else dropIcon = "droptriangledown";
        
        let droptext;
        if(data.is_dropped)droptext="hide";
        else droptext = "show "+children.length+" descendant"+((children.length>1&&"s")||"")
        
        return(
            <div
            class={
                "outcome"+((this.state.selected && " selected")||"")+((data.is_dropped && " dropped")||"")
            }
            ref={this.maindiv} 
            onClick={(evt)=>selection_manager.changeSelection(evt,this)}>
                <div class="outcome-title">
                    <TitleText text={data.title} defaultText={"Click to edit"}/>
                </div>
                {children.length>0 && 
                    <div class="outcome-drop" onClick={this.toggleDrop.bind(this)}>
                        <div class = "outcome-drop-img">
                            <img src={iconpath+dropIcon+".svg"}/>
                        </div>
                        <div class = "outcome-drop-text">
                            {droptext}
                        </div>
                    </div>
                }
                <div class="children-block" id={this.props.objectID+"-children-block"} ref={this.children_block}>
                    {children}
                </div>
                <div class="mouseover-actions">
                    {actions}
                </div>
                {this.addEditable(data)}
            </div>
            
        );
    }
    
    postMountFunction(){
        
        this.makeSortable($(this.children_block.current),this.props.objectID,"outcomeoutcome",".outcomeoutcome",false,false,".children-block",false);
    }


    toggleDrop(){
        this.props.dispatch(changeField(this.props.objectID,this.objectType,"is_dropped",!this.props.data.is_dropped));
    }

    sortableMovedFunction(id,new_position,type,new_parent){
        this.props.dispatch(moveOutcomeOutcome(id,new_position,new_parent));
    }

    stopSortFunction(){
        
    }
    
    
}
const mapOutcomeStateToProps = (state,own_props)=>(
    getOutcomeByID(state,own_props.objectID)
)
export const OutcomeViewConnected = connect(
    mapOutcomeStateToProps,
    null
)(OutcomeView)


//Basic component representing the outcome view
export class OutcomeTopView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcome";
    }
    
    render(){
        let data = this.props.data;
        var selector = this;
        
        return(
            <div id="outcome-wrapper" class="workflow-wrapper">
                <div class = "workflow-container">
                    <div class="workflow-details">
                        <WorkflowForMenu workflow_data={data} selected={this.state.selected} selectAction={(evt)=>{selection_manager.changeSelection(evt,selector)}}/>
                        <OutcomeViewConnected objectID={data.id}/>
                    </div>
                </div>
                {this.addEditable(data)}
            </div>
        );
    }
    
}
export const OutcomeTopViewConnected = connect(
    mapOutcomeStateToProps,
    null
)(OutcomeTopView)

export function renderOutcomeView(container){
    store = createStore(rootReducer,initial_data);
    reactDom.render(
        <Provider store = {store}>
            <OutcomeTopViewConnected objectID={initial_data.outcome[0].id}/>
        </Provider>,
        container
    );
}