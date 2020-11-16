import {Component, createRef} from "react";
import * as reactDom from "react-dom";
import * as Redux from "redux";
import * as React from "react";
import {Decimal} from 'decimal.js/decimal';
import {Provider, connect} from 'react-redux';
import {configureStore, createStore} from '@reduxjs/toolkit';
let amount = new Decimal(0.00);
import {dot as mathdot, subtract as mathsubtract, matrix as mathmatrix, add as mathadd, multiply as mathmultiply, norm as mathnorm, isNaN as mathisnan} from "mathjs";


const node_keys=["activity","course","program"];
const columnwidth = 200


//A utility function to trigger an event on each element. This is used to avoid .trigger, which bubbles (we will be careful to only trigger events on the elements that need them)
export function triggerHandlerEach(trigger,eventname){
    return trigger.each((i,element)=>{$(element).triggerHandler(eventname);});
}

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
            this.currentSelection.setState({selected:true});
            $("#node-bar-container").css("display","none");
        }else $("#node-bar-container").css("display","revert");
    }

}


const moveColumnWorkflow = (id,new_position) => {
    return {
        type: 'columnworkflow/movedTo',
        payload:{id:id,new_index:new_position}
    }
}

const moveStrategyWorkflow = (id,new_position) => {
    return {
        type: 'strategyworkflow/movedTo',
        payload:{id:id,new_index:new_position}
    }
}

const deleteSelfAction = (id,parentID,objectType) => {
    return {
        type: objectType+"/deleteSelf",
        payload:{id:id,parent_id:parentID}
    }
}

const insertBelowAction = (response_data,objectType) => {
    return {
        type: objectType+"/insertBelow",
        payload:response_data
    }
}


const newNodeAction = (response_data) => {
    console.log("creating new node action");
    return {
        type: "node/newNode",
        payload:response_data
    }
}

const columnChangeNodeStrategy = (id,delta_x,columnworkflows) => {
    return {
        type: 'node/movedColumnBy',
        payload:{id:id,delta_x,columnworkflows:columnworkflows}
    }
}

const moveNodeStrategy = (id,new_position,new_parent,nodes_by_column) => {
    return {
        type: 'nodestrategy/movedTo',
        payload:{id:id,new_index:new_position,new_parent:new_parent,nodes_by_column:nodes_by_column}
    }
}


const changeField = (id,objectType,field,value) => {
    return {
        type: objectType+'/changeField',
        payload:{id:id,field:field,value:value}
    }
}

function workflowReducer(state={},action){
    switch(action.type){
        case 'columnworkflow/movedTo':
            var new_columnworkflow_set = state.columnworkflow_set.slice();
            for(var i=0;i<new_columnworkflow_set.length;i++){
                if(new_columnworkflow_set[i]==action.payload.id){
                    new_columnworkflow_set.splice(action.payload.new_index,0,new_columnworkflow_set.splice(i,1)[0]);
                    break;
                }
            }
            insertedAt(action.payload.id,"columnworkflow",state.id,action.payload.new_index);
            return {
                ...state,
                columnworkflow_set:new_columnworkflow_set
            }
        case 'strategyworkflow/movedTo':
            var new_strategyworkflow_set = state.strategyworkflow_set.slice();
            for(var i=0;i<new_strategyworkflow_set.length;i++){
                if(new_strategyworkflow_set[i]==action.payload.id){
                    new_strategyworkflow_set.splice(action.payload.new_index,0,new_strategyworkflow_set.splice(i,1)[0]);
                    break;
                }
            }
            insertedAt(action.payload.id,"strategyworkflow",state.id,action.payload.new_index);
            return {
                ...state,
                strategyworkflow_set:new_strategyworkflow_set
            }
        case 'strategy/deleteSelf':
            if(state.strategyworkflow_set.indexOf(action.payload.parent_id)>=0){
                var new_state = {...state};
                new_state.strategyworkflow_set = state.strategyworkflow_set.slice();
                new_state.strategyworkflow_set.splice(new_state.strategyworkflow_set.indexOf(action.payload.parent_id),1);
                return new_state;
            }
            return state;
        case 'strategy/insertBelow':
            new_state = {...state}
            var new_strategyworkflow_set = state.strategyworkflow_set.slice();
            new_strategyworkflow_set.splice(new_strategyworkflow_set.indexOf(action.payload.siblingID)+1,0,action.payload.new_through.id);
            new_state.strategyworkflow_set = new_strategyworkflow_set;
            return new_state;
        case 'column/deleteSelf':
            if(state.columnworkflow_set.indexOf(action.payload.parent_id)>=0){
                var new_state = {...state};
                new_state.columnworkflow_set = state.columnworkflow_set.slice();
                new_state.columnworkflow_set.splice(new_state.columnworkflow_set.indexOf(action.payload.parent_id),1);
                return new_state;
            }
            return state;
        case 'node/newNode':
            if(state.columnworkflow_set.indexOf(action.payload.columnworkflow.id)>=0)return state;
            new_state = {...state}
            var new_columnworkflow_set = state.columnworkflow_set.slice();
            new_columnworkflow_set.push(action.payload.columnworkflow.id);
            new_state.columnworkflow_set = new_columnworkflow_set;
            return new_state;
        case 'column/insertBelow':
            new_state = {...state}
            var new_columnworkflow_set = state.columnworkflow_set.slice();
            new_columnworkflow_set.splice(new_columnworkflow_set.indexOf(action.payload.siblingID)+1,0,action.payload.new_through.id);
            new_state.columnworkflow_set = new_columnworkflow_set;
            return new_state;
        case 'workflow/changeField':
            var new_state = {...state};
            new_state[action.payload.field]=action.payload.value;
            return new_state;
        default:
            return state;
    }
}

function columnworkflowReducer(state={},action){
    switch(action.type){
        case 'column/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parent_id){
                    var new_state=state.slice();
                    new_state.splice(i,1);
                    return new_state;
                }
            }
            return state;
        case 'node/newNode':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.columnworkflow.id)return state;
            }
            new_state = state.slice();
            new_state.push(action.payload.columnworkflow);
            return new_state;
        case 'column/insertBelow':
            new_state = state.slice();
            new_state.push(action.payload.new_through);
            return new_state;
        default:
            return state;
    }
}

function columnReducer(state={},action){
    switch(action.type){
        case 'column/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state.splice(i,1);
                    deleteSelf(action.payload.id,"column");
                    return new_state;
                }
            }
            return state;
        case 'node/newNode':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.column.id)return state;
            }
            new_state = state.slice();
            new_state.push(action.payload.column);
            return new_state;
        case 'column/insertBelow':
            new_state = state.slice();
            new_state.push(action.payload.new_model);
            return new_state;
        case 'column/changeField':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]};
                    new_state[i][action.payload.field]=action.payload.value;
                    return new_state;
                }
            }
            return state;
        default:
            return state;
    }
}

function strategyworkflowReducer(state={},action){
    switch(action.type){
        case 'strategy/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parent_id){
                    var new_state=state.slice();
                    new_state.splice(i,1);
                    return new_state;
                }
            }
            return state;
        case 'strategy/insertBelow':
            new_state = state.slice();
            new_state.push(action.payload.new_through);
            return new_state;
        default:
            return state;
    }
}
function strategyReducer(state={},action){
    switch(action.type){
        case 'nodestrategy/movedTo':
            let old_parent,old_parent_index,new_parent,new_parent_index;
            for(var i=0;i<state.length;i++){
                if(state[i].nodestrategy_set.indexOf(action.payload.id)>=0){
                    old_parent_index=i;
                    old_parent={...state[i]};
                }
                if(state.[i].id==action.payload.new_parent){
                    new_parent_index=i;
                    new_parent={...state[i]};
                }
            }
            var new_index = action.payload.new_index;
            //Correction for if we are in a term:
            if(action.payload.nodes_by_column){
                for(var col in action.payload.nodes_by_column){
                    if(action.payload.nodes_by_column[col].indexOf(action.payload.id)>=0){
                        let previous = action.payload.nodes_by_column[col][new_index];
                        new_index = new_parent.nodestrategy_set.indexOf(previous);
                    }
                }
            }
            
            
            var new_state = state.slice();
            old_parent.nodestrategy_set= old_parent.nodestrategy_set.slice();
            old_parent.nodestrategy_set.splice(old_parent.nodestrategy_set.indexOf(action.payload.id),1);
            if(old_parent_index==new_parent_index){
                old_parent.nodestrategy_set.splice(new_index,0,action.payload.id);
            }else{
                new_parent.nodestrategy_set = new_parent.nodestrategy_set.slice();
                new_parent.nodestrategy_set.splice(new_index,0,action.payload.id);
                new_state.splice(new_parent_index,1,new_parent);
                
            }
            new_state.splice(old_parent_index,1,old_parent);
            insertedAt(action.payload.id,"nodestrategy",old_parent.id,new_index,new_parent.id);
            return new_state;
        case 'node/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].nodestrategy_set.indexOf(action.payload.parent_id)>=0){
                    var new_state=state.slice();
                    new_state[i] = {...new_state[i]};
                    new_state[i].nodestrategy_set = state[i].nodestrategy_set.slice();
                    new_state[i].nodestrategy_set.splice(new_state[i].nodestrategy_set.indexOf(action.payload.parent_id),1);
                    return new_state;
                }
            }
            return state;
        case 'node/insertBelow':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parentID){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]}
                    var new_nodestrategy_set = state[i].nodestrategy_set.slice();
                    new_nodestrategy_set.splice(new_nodestrategy_set.indexOf(action.payload.siblingID)+1,0,action.payload.new_through.id);
                    new_state[i].nodestrategy_set = new_nodestrategy_set;
                    return new_state;
                }
            }
            return state;
        case 'node/newNode':
            console.log("creating node in strat");
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parentID){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]}
                    var new_nodestrategy_set = state[i].nodestrategy_set.slice();
                    new_nodestrategy_set.splice(action.payload.index,0,action.payload.new_through.id);
                    new_state[i].nodestrategy_set = new_nodestrategy_set;
                    console.log(new_state);
                    return new_state;
                }
            }
            return state;
        case 'strategy/insertBelow':
            new_state = state.slice();
            new_state.push(action.payload.new_model);
            return new_state;
        case 'strategy/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state.splice(i,1);
                    deleteSelf(action.payload.id,"strategy");
                    return new_state;
                }
            }
            return state;
        case 'strategy/changeField':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]};
                    new_state[i][action.payload.field]=action.payload.value;
                    return new_state;
                }
            }
            return state;
        default:
            return state;
    }
}


function nodestrategyReducer(state={},action){
    switch(action.type){
        case 'node/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parent_id){
                    var new_state=state.slice();
                    new_state.splice(i,1);
                    return new_state;
                }
            }
            return state;
        case 'node/insertBelow':
        case 'node/newNode':
            console.log("creating node in ns");
            new_state = state.slice();
            new_state.push(action.payload.new_through);
            return new_state;
        default:
            return state;
    }
}
function nodeReducer(state={},action){
    switch(action.type){
        case 'node/movedColumnBy':
            var new_state = state.slice();
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    try{
                        let columns = action.payload.columnworkflows;
                        let new_columnworkflow = columns[columns.indexOf(state[i].columnworkflow)+action.payload.delta_x];
                        var new_nodedata = {
                            ...state[i],
                            columnworkflow:new_columnworkflow,
                        };
                        new_state.splice(i,1,new_nodedata);
                        columnChanged(action.payload.id,new_columnworkflow);
                    }catch(err){console.log("couldn't find new column");return state;}
                    return new_state;
                }
            }
            return state;
        case 'node/dropped':
            return state;
        case 'node/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state.splice(i,1);
                    deleteSelf(action.payload.id,"node")
                    return new_state;
                }
            }
            return state;
        case 'node/insertBelow':
        case 'node/newNode':
            console.log("creating node in node");
            new_state = state.slice();
            new_state.push(action.payload.new_model);
            return new_state;
        case 'node/changeField':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]};
                    new_state[i][action.payload.field]=action.payload.value;
                    return new_state;
                }
            }
            return state;
        default:
            return state;
    }
}

const rootReducer = Redux.combineReducers({
    workflow:workflowReducer,
    columnworkflow:columnworkflowReducer,
    column:columnReducer,
    strategyworkflow:strategyworkflowReducer,
    strategy:strategyReducer,
    nodestrategy:nodestrategyReducer,
    node:nodeReducer,
});

const store = createStore(rootReducer,initial_data);

const getColumnByID = (state,id)=>{
    for(var i in state.column){
        var column = state.column[i];
        if(column.id==id)return {data:column};
    }
}
const getColumnWorkflowByID = (state,id)=>{
    for(var i in state.columnworkflow){
        var columnworkflow = state.columnworkflow[i];
        if(columnworkflow.id==id)return {data:columnworkflow,order:state.workflow.columnworkflow_set};
    }
}
const getStrategyByID = (state,id)=>{
    for(var i in state.strategy){
        var strategy = state.strategy[i];
        if(strategy.id==id)return {data:strategy,column_order:state.workflow.columnworkflow_set};
    }
}
const getTermByID = (state,id)=>{
    for(var i in state.strategy){
        var strategy = state.strategy[i];
        if(strategy.id==id){
            var nodestrategies = strategy.nodestrategy_set;
            var nodes_by_column = {};
            for(var j=0;j<state.workflow.columnworkflow_set.length;j++){
                nodes_by_column[state.workflow.columnworkflow_set[j]]=[];
            }
            for(var j=0;j<nodestrategies.length;j++){
                let node_strategy = getNodeStrategyByID(state,nodestrategies[j]).data;
                let node = getNodeByID(state,node_strategy.node).data;
                nodes_by_column[node.columnworkflow].push(nodestrategies[j]);
            }
            return {data:strategy,column_order:state.workflow.columnworkflow_set,nodes_by_column:nodes_by_column};
        }
    }
}
const getStrategyWorkflowByID = (state,id)=>{
    for(var i in state.strategyworkflow){
        var strategyworkflow = state.strategyworkflow[i];
        if(strategyworkflow.id==id)return {data:strategyworkflow,order:state.workflow.strategyworkflow_set};
    }
}
const getNodeByID = (state,id)=>{
    for(var i in state.node){
        var node = state.node[i];
        if(node.id==id)return {data:node,column_order:state.workflow.columnworkflow_set};
    }
}
const getNodeStrategyByID = (state,id)=>{
    for(var i in state.nodestrategy){
        var nodestrategy = state.nodestrategy[i];
        if(nodestrategy.id==id)return {data:nodestrategy,order:getStrategyByID(state,nodestrategy.strategy).nodestrategy_set};
    }
}

//Extends the react component to add a few features that are used in a large number of components
export class ComponentJSON extends Component{
    constructor(props){
        super(props);
        this.state={};
        this.maindiv = createRef();
    }
    
    componentDidMount(){
        this.postMountFunction();
    }
    
    postMountFunction(){};
    
    makeSortableNode(sortable_block,parent_id,draggable_type,draggable_selector,axis=false,grid=false,connectWith="",handle=false){
        var props = this.props;
        sortable_block.draggable({
            containment:".workflow-container",
            axis:axis,
            cursor:"move",
            cursorAt:{top:20,left:100},
            handle:handle,
            distance:10,
            refreshPositions:true,
            helper:(e,item)=>{
                var helper = $(document.createElement('div'));
                helper.addClass("node-ghost");
                helper.appendTo(".workflow-container");
                return helper;
            },
            start:(e,ui)=>{
                $(".workflow-canvas").addClass("dragging-"+draggable_type);
                $(draggable_selector).addClass("dragging");
                
                
            },
            drag:(e,ui)=>{
                
                var delta_x= Math.round((ui.helper.offset().left-$("#"+$(e.target).attr("id")+draggable_selector).children(handle).first().offset().left)/columnwidth);
                if(delta_x!=0){
                    this.sortableColumnChangedFunction($(e.target).attr("id"),delta_x);
                }
            },
            stop:(e,ui)=>{
                $(".workflow-canvas").removeClass("dragging-"+draggable_type);
                $(draggable_selector).removeClass("dragging");
            
            }
            
            
        });
        
        sortable_block.droppable({
            tolerance:"pointer",
            droppable:".node-ghost",
            over:(e,ui)=>{
                var drop_item = $(e.target);
                var drag_item = ui.draggable;
                var new_index = drop_item.prevAll().length;
                var new_parent_id = parseInt(drop_item.parent().attr("id")); 
                
                if(!drag_item.hasClass("new-node")){
                    this.sortableMovedFunction(parseInt(drag_item.attr("id")),new_index,draggable_type,new_parent_id);
                }else{
                    $(".new-node-drop-over").removeClass("new-node-drop-over");
                    drop_item.addClass("new-node-drop-over");
                }
            },
            drop:(e,ui)=>{
                $(".new-node-drop-over").removeClass("new-node-drop-over");
                var drop_item = $(e.target);
                var drag_item = ui.draggable;
                var new_index = drop_item.prevAll().length+1;
                console.log(drop_item);
                console.log(drag_item);
                if(drag_item.hasClass("new-node")){
                    console.log(drag_item[0].dataDraggable);
                    newNode(this.props.objectID,new_index,drag_item[0].dataDraggable.column,drag_item[0].dataDraggable.column_type,
                        (response_data)=>{
                            let action = newNodeAction(response_data);
                            props.dispatch(action);
                        }
                    );
                }
            }
        });
        
    }
    
    makeSortable(sortable_block,parent_id,draggable_type,draggable_selector,axis=false,grid=false,connectWith="",handle=false){
        sortable_block.sortable({
            containment:".workflow-container",
            axis:axis,
            cursor:"move",
            grid:grid,
            cursorAt:{top:20},
            handle:handle,
            tolerance:"pointer",
            distance:10,
            start:(e,ui)=>{
                $(".workflow-canvas").addClass("dragging-"+draggable_type);
                $(draggable_selector).addClass("dragging");
                //Calls a refresh of the sortable in case adding the draggable class resized the object (which it does in many cases)
                sortable_block.sortable("refresh");
                //Fix the vertical containment. This is especially necessary when the item resizes.
                var sort = $(sortable_block).sortable("instance");
                sort.containment[3]+=sort.currentItem[0].offsetTop;
                
            },
            //Tell the dragging object that we are dragging it
            sort:(e,ui)=>{
                //figure out if the order has changed
                var placeholder_index = ui.placeholder.prevAll().not(".ui-sortable-helper").length;
                if(ui.placeholder.parent()[0]!=ui.item.parent()[0]||ui.item.prevAll().not(".ui-sortable-placeholder").length!=placeholder_index){
                    var new_parent_id = parseInt(ui.placeholder.parent().attr("id"));
                    this.sortableMovedFunction(parseInt(ui.item.attr("id")),placeholder_index,draggable_type,new_parent_id);
                }
                
                ui.item.triggerHandler("dragging");
            },
            stop:(evt,ui)=>{
                var object_id = parseInt(ui.item.attr("id"));
                var new_position = ui.item.prevAll().length;
                var new_parent_id = parseInt(ui.item.parent().attr("id"));
                $(draggable_selector).removeClass("dragging");
                //sortable_block.sortable("cancel");
                this.stopSortFunction(object_id,new_position,draggable_type,new_parent_id);
                //Automatic scroll, useful when moving weeks that shrink significantly to make sure the dropped item is kept in focus. This should be updated to only scroll if the item ends up outside the viewport, and to scroll the minimum amount to keep it within.
                $("#container").animate({
                    scrollTop: ui.item.offset().top-200
                },20);
            }
        });
    }
    
    //Adds a button that deltes the item (with a confirmation). The callback function is called after the object is removed from the DOM
    addDeleteSelf(data){
        return (
            <ActionButton button_icon="delrect.svg" button_class="delete-self-button" handleClick={()=>{
                //Temporary confirmation; add better comfirmation dialogue later
                if(window.confirm("Are you sure you want to delete this "+this.objectType+"?")){
                    this.props.dispatch(deleteSelfAction(data.id,this.props.throughParentID,this.objectType))
                }
            }}/>
        );
    }
    
    //Adds a button that inserts a sibling below the item. The callback function unfortunately does NOT seem to be called after the item is added to the DOM
    addInsertSibling(data){
        var props = this.props;
        var type = this.objectType;
        return(
            <ActionButton button_icon="add.svg" button_class="insert-sibling-button" handleClick={()=>insertSibling(data.id,this.objectType,this.props.parentID,
                (response_data)=>{
                    let action = insertBelowAction(response_data,type);
                    props.dispatch(action);
                }
            )}/>
        );
    }
    
    //Makes the item selectable
    addEditable(data){
        if(this.state.selected){
            var type=this.objectType;
            return reactDom.createPortal(
                <div class="right-panel-container edit-bar-container" onClick={(evt)=>{evt.stopPropagation()}}>
                    <div class="right-panel-inner">
                        <h3>Edit:</h3>
                        {["node","strategy","column"].indexOf(type)>=0 &&
                            <div>
                                <h4>Title:</h4>
                                <input value={data.title} onChange={this.inputChanged.bind(this,"title")}/>
                            </div>
                        }
                        {["node"].indexOf(type)>=0 &&
                            <div>
                                <h4>Description:</h4>
                                <input value={data.description} onChange={this.inputChanged.bind(this,"description")}/>
                            </div>
                        }
                        {type=="node" && data.node_type!=0 &&
                            <div>
                                <h4>Linked Workflow:</h4>
                                <div>{data.linked_workflow_title}</div>
                                <button onClick={()=>{getLinkedWorkflowMenu(data)}}>
                                    Change
                                </button>
                            </div>
                        }
                        {this.addDeleteSelf(data)}
                    </div>
                </div>
            ,$("#container")[0])
        }
    }
    
    inputChanged(field,evt){
        this.props.dispatch(changeField(this.props.data.id,this.objectType,field,evt.target.value));
    }
}



//A button which causes an item to delete itself or insert a new item below itself.
export class ActionButton extends Component{
    constructor(props){
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }
    
    render(){
        return (
            <div class={this.props.button_class+" action-button"} onClick={this.handleClick}>
                <img src={iconpath+this.props.button_icon}/>
            </div>
        )
    }
    
    handleClick(evt){
        this.props.handleClick(evt);
    }
}

//Text that can be passed a default value
export class TitleText extends Component{
    constructor(props){
        super(props);
    }
    
    render(){
        var text = this.props.text;
        if((this.props.text==null || this.props.text=="") && this.props.defaultText!=null){
            text=(
                <span class="default=text">{this.props.defaultText}</span>
            );
        }
        return (
            <div>{text}</div>
        )
    }

}


//Basic component to represent a Node
export class NodeView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="node";
        this.objectClass=".node";
        this.state={
            is_dropped:false
        }
    }
    
    render(){
        let data = this.props.data;
        return (
            <div 
                style={
                    {left:columnwidth*this.props.column_order.indexOf(data.columnworkflow)+"px"}
                } 
                class={
                    "node column-"+data.columnworkflow+((this.state.selected && " selected")||"")+((this.state.is_dropped && " dropped")||"")+" "+node_keys[data.node_type]
                } 
                id={data.id} 
                ref={this.maindiv} 
                onClick={(evt)=>selection_manager.changeSelection(evt,this)}
            >
                <div class = "node-top-row">
                    <div class = "node-icon">

                    </div>
                    <div class = "node-title">
                        <TitleText text={data.title} defaultText="New Node"/>
                    </div>
                    <div class = "node-icon">

                    </div>
                </div>
                <div class = "node-details">
                    <TitleText text={data.description} defaultText="Click to edit"/>
                </div>
                <div class = "node-drop-row" onClick={this.toggleDrop.bind(this)}>

                </div> 
                <div class="mouseover-actions">
                    {this.addInsertSibling(data)}
                    {this.addDeleteSelf(data)}
                </div>
                {this.addEditable(data)} 
            </div>
        );
    }
    
    toggleDrop(){
        this.setState({is_dropped:!this.state.is_dropped},()=>triggerHandlerEach($(".node"),"refresh-links"));
    }
}
const mapNodeStateToProps = (state,own_props)=>(
    getNodeByID(state,own_props.objectID)
)
const mapNodeDispatchToProps = {};
export const NodeViewConnected = connect(
    mapNodeStateToProps,
    null
)(NodeView)


//Basic component to represent a NodeStrategy
export class NodeStrategyView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="nodestrategy";
        this.objectClass=".node-strategy";
    }
    
    render(){
        let data = this.props.data;
        return (
            <div class="node-strategy" id={data.id} ref={this.maindiv}>
                <NodeViewConnected objectID={data.node} parentID={this.props.parentID} throughParentID={data.id}/>
            </div>
        );
    }
    
}
const mapNodeStrategyStateToProps = (state,own_props)=>(
    getNodeStrategyByID(state,own_props.objectID)
)
const mapNodeStrategyDispatchToProps = {};
export const NodeStrategyViewConnected = connect(
    mapNodeStrategyStateToProps,
    null
)(NodeStrategyView)

//Basic component to represent a Strategy
export class StrategyView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="strategy";
        this.objectClass=".strategy";
        this.node_block = createRef();
    }
    
    render(){
        let data = this.props.data;
        var nodes = data.nodestrategy_set.map((nodestrategy)=>
            <NodeStrategyViewConnected key={nodestrategy} objectID={nodestrategy} parentID={data.id}/>
        );
        if(nodes.length==0)nodes.push(
            <div class="node-strategy" style={{height:"100%"}}></div>
        );
        return (
            <div class={"strategy"+((this.state.selected && " selected")||"")} ref={this.maindiv} onClick={(evt)=>selection_manager.changeSelection(evt,this)}>
                <div class="mouseover-container-bypass">
                    <div class="mouseover-actions">
                        {this.addInsertSibling(data)}
                        {this.addDeleteSelf(data)}
                    </div>
                </div>
                <TitleText text={data.title} defaultText={data.strategy_type_display+" "+(this.props.rank+1)}/>
                <div class="node-block" id={this.props.objectID+"-node-block"} ref={this.node_block}>
                    {nodes}
                </div>
                {this.addEditable(data)}
            </div>
        );
    }
    
    postMountFunction(){
        this.makeDragAndDrop();
    }

    componentDidUpdate(){
        this.makeDragAndDrop();
    }

    makeDragAndDrop(){
        //Makes the nodestrategies in the node block draggable
        this.makeSortableNode($(this.node_block.current).children(".node-strategy").not(".ui-draggable"),
          this.props.objectID,
          "nodestrategy",
          ".node-strategy",
          false,
          [200,1],
          ".node-block",
          ".node");
    }

    stopSortFunction(id,new_position,type,new_parent){
        this.props.dispatch(moveNodeStrategy(id,new_position,new_parent,this.props.nodes_by_column))
    }
    
    sortableColumnChangedFunction(id,delta_x){
        var state = store.getState();
        let node_id = getNodeStrategyByID(state,id).data.node;
        this.props.dispatch(columnChangeNodeStrategy(node_id,delta_x,this.props.column_order));
    }
    
    sortableMovedFunction(id,new_position,type,new_parent){
        this.props.dispatch(moveNodeStrategy(id,new_position,new_parent,this.props.nodes_by_column))
    }

}
const mapStrategyStateToProps = (state,own_props)=>(
    getStrategyByID(state,own_props.objectID)
)
const mapStrategyDispatchToProps = {};
export const StrategyViewConnected = connect(
    mapStrategyStateToProps,
    null
)(StrategyView)


//Basic component to represent a Strategy
export class TermView extends StrategyView{
    
    render(){
        let data = this.props.data;
        var node_blocks = [];
        for(var i=0;i<this.props.column_order.length;i++){
            let col=this.props.column_order[i];
            let nodestrategies = [];
            for(var j=0;j<data.nodestrategy_set.length;j++){
                let nodestrategy = data.nodestrategy_set[j];
                if(this.props.nodes_by_column[col].indexOf(nodestrategy)>=0){
                    nodestrategies.push(
                        <NodeStrategyViewConnected key={nodestrategy} objectID={nodestrategy} parentID={data.id}/>
                    );
                }
            }
            if(nodestrategies.length==0)nodestrategies.push(
                <div class="node-strategy" style={{height:"100%"}}></div>
            )
            node_blocks.push(
                <div class={"node-block term column-"+col} id={this.props.objectID+"-node-block-column-"+col} key={col} >
                    {nodestrategies}
                </div>
            );
        }
        return (
            <div class={"strategy"+((this.state.selected && " selected")||"")} ref={this.maindiv} onClick={(evt)=>selection_manager.changeSelection(evt,this)}>
                <div class="mouseover-container-bypass">
                    <div class="mouseover-actions">
                        {this.addInsertSibling(data)}
                        {this.addDeleteSelf(data)}
                    </div>
                </div>
                <TitleText text={data.title} defaultText={data.strategy_type_display+" "+(this.props.rank+1)}/>
                <div class="node-block" id={this.props.objectID+"-node-block"} ref={this.node_block}>
                    {node_blocks}
                </div>
                {this.addEditable(data)}
            </div>
        );
    }

    makeDragAndDrop(){
        //Makes the nodestrategies in the node block draggable
        this.makeSortableNode($(this.node_block.current).children().children(".node-strategy").not(".ui-draggable"),
          this.props.objectID,
          "nodestrategy",
          ".node-strategy",
          false,
          [200,1],
          ".node-block",
          ".node");
    }
}
const mapTermStateToProps = (state,own_props)=>(
    getTermByID(state,own_props.objectID)
)
const mapTermDispatchToProps = {};
export const TermViewConnected = connect(
    mapTermStateToProps,
    null
)(TermView)


//Basic strategyworkflow component
export class StrategyWorkflowView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="strategyworkflow";
        this.objectClass=".strategy-workflow";
    }
    
    render(){
        let data = this.props.data;
        var strategy;
        if(data.strategy_type==2)strategy = (
                <TermViewConnected objectID={data.strategy} rank={this.props.order.indexOf(data.id)} parentID={this.props.parentID} throughParentID={data.id}/>
        );
        else strategy = (
            <StrategyViewConnected objectID={data.strategy} rank={this.props.order.indexOf(data.id)} parentID={this.props.parentID} throughParentID={data.id}/>
        );
        return (
            <div class="strategy-workflow" id={data.id} ref={this.maindiv}>
                {strategy}
            </div>
        );
    }
}
const mapStrategyWorkflowStateToProps = (state,own_props)=>(
    getStrategyWorkflowByID(state,own_props.objectID)
)
const mapStrategyWorkflowDispatchToProps = {};
export const StrategyWorkflowViewConnected = connect(
    mapStrategyWorkflowStateToProps,
    null
)(StrategyWorkflowView)


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
                {this.addEditable(data)}
                <div class="mouseover-actions">
                    {this.addInsertSibling(data)}
                    {this.addDeleteSelf(data)}
                </div>
            </div>
        );
    }
}
const mapColumnStateToProps = (state,own_props)=>(
    getColumnByID(state,own_props.objectID)
)
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
            <div class={"column-workflow column-"+data.id} ref={this.maindiv} id={data.id}>
                <ColumnViewConnected objectID={data.column} parentID={this.props.parentID} throughParentID={data.id}/>
            </div>
        )
    }
}
const mapColumnWorkflowStateToProps = (state,own_props)=>(
    getColumnWorkflowByID(state,own_props.objectID)
)
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
            <ColumnWorkflowViewConnected key={columnworkflow} objectID={columnworkflow} parentID={data.id}/>
        );
        var strategyworkflows = data.strategyworkflow_set.map((strategyworkflow)=>
            <StrategyWorkflowViewConnected key={strategyworkflow} objectID={strategyworkflow} parentID={data.id}/>
        );
        
        return(
            <div id="workflow-wrapper" class="workflow-wrapper">
                <div class = "workflow-container">
                    <div class="workflow-details">
                        <div class="column-row">
                            {columnworkflows}
                        </div>
                        <div class="strategy-block">
                            {strategyworkflows}
                        </div>
                        <svg class="workflow-canvas" width="100%" height="100%">
                            <defs>
                                <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5"
                                    markerWidth="4" markerHeight="4"
                                    orient="auto-start-reverse">
                                  <path d="M 0 0 L 10 5 L 0 10 z" />
                                </marker>
                            </defs>
                        </svg>
                    </div>
                    {reactDom.createPortal(
                        <NodeBarConnected/>
                    ,$("#container")[0])}
                </div>
            </div>
        );
    }
    
    postMountFunction(){
        this.makeSortable($(".column-row"),
          this.props.objectID,
          "columnworkflow",
          ".column-workflow",
          "x");
        this.makeSortable($(".strategy-block"),
          this.props.objectID,
          "strategyworkflow",
          ".strategy-workflow",
          "y");
    }
    
    
    stopSortFunction(id,new_position,type){
        if(type=="columnworkflow")this.props.dispatch(moveColumnWorkflow(id,new_position))
        if(type=="strategyworkflow")this.props.dispatch(moveStrategyWorkflow(id,new_position))
    }
    
    
    sortableMovedFunction(id,new_position,type){
        if(type=="columnworkflow")this.props.dispatch(moveColumnWorkflow(id,new_position))
        if(type=="strategyworkflow")this.props.dispatch(moveStrategyWorkflow(id,new_position))
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

export class NodeBar extends ComponentJSON{
    render(){
        let data = this.props.data;
        console.log(this.props.data);
        var nodebarcolumnworkflows = data.columnworkflow_set.map((columnworkflow)=>
            <NodeBarColumnWorkflowConnected key={columnworkflow} objectID={columnworkflow}/>
        );
        console.log(this.props);
        var columns_present = this.props.columns.map(col=>col.column_type);
        console.log(columns_present);
        console.log(data.DEFAULT_COLUMNS);
        for(var i=0;i<data.DEFAULT_COLUMNS.length;i++){
            if(columns_present.indexOf(data.DEFAULT_COLUMNS[i])<0){
                nodebarcolumnworkflows.push(
                    <NodeBarColumnWorkflowConnected key={"default"+i} columnType={data.DEFAULT_COLUMNS[i]}/>
                )
            }
        }
        nodebarcolumnworkflows.push(
            <NodeBarColumnWorkflowConnected key={"default"+i} columnType={data.DEFAULT_CUSTOM_COLUMN}/>
        )
        
        
        var nodebarstrategyworkflows = data.strategyworkflow_set.map((strategyworkflow)=>
            <NodeBarStrategyWorkflowConnected key={strategyworkflow} objectID={strategyworkflow}/>
        );
        
        return(
            <div id="node-bar-container" ref={this.nodebar} class="node-bar-container right-panel-container">
                <div id="node-bar-workflow" class="right-panel-inner">
                    <div class="node-bar-column-block">
                        {nodebarcolumnworkflows}
                    </div>
                    <div class="node-bar-strategy-block">
                        {nodebarstrategyworkflows}
                    </div>
                </div>
            </div>
        );
    }
}
const mapNodeBarStateToProps = state=>({
    data:state.workflow,
    columns:state.column
})
export const NodeBarConnected = connect(
    mapNodeBarStateToProps,
    null
)(NodeBar)

export class NodeBarColumnWorkflow extends ComponentJSON{
    render(){
        console.log(this.props.data);
        let data = this.props.data;
        if(data)return(
            <div class="node-bar-column-workflow" ref={this.maindiv}>
                <NodeBarColumnConnected objectID={data.column} parentID={data.id}/>
            </div>
        );
        else return(
            <div class="node-bar-column-workflow" ref={this.maindiv}>
                <NodeBarColumnCreator columnType={this.props.columnType}/>
            </div>
        );
    }
}
export const NodeBarColumnWorkflowConnected = connect(
    mapColumnWorkflowStateToProps,
    null
)(NodeBarColumnWorkflow)

export class NodeBarColumn extends ComponentJSON{
    render(){
        let data = this.props.data;
        var title;
        if(data)title = data.title;
        if(!title)title=data.column_type_display;
        return(
            <div class="new-node node-bar-column node-bar-sortable" ref={this.maindiv}>
                {title}
            </div>
        );
    }
    
    makeDraggable(){
        let draggable_selector = "node-strategy"
        let draggable_type = "nodestrategy"
        console.log(this.maindiv);
        $(this.maindiv.current).draggable({
            helper:(e,item)=>{
                var helper = $(document.createElement('div'));
                helper.addClass("node-ghost");
                helper.appendTo(document.body);
                return helper;
            },
            containment:".workflow-container",
            cursor:"move",
            cursorAt:{top:20,left:100},
            distance:10,
            start:(e,ui)=>{
                $(".workflow-canvas").addClass("dragging-"+draggable_type);
                $(draggable_selector).addClass("dragging");
            },
            stop:(e,ui)=>{
                $(".workflow-canvas").removeClass("dragging-"+draggable_type);
                $(draggable_selector).removeClass("dragging");
            }
        });
    }
    
    postMountFunction(){
        this.makeDraggable();
        $(this.maindiv.current)[0].dataDraggable={column:this.props.data.id,column_type:null}
    }
    
    
    
}
export const NodeBarColumnConnected = connect(
    mapColumnStateToProps,
    null
)(NodeBarColumn)

export class NodeBarColumnCreator extends NodeBarColumn{
    render(){
        var title="New ";
        for(var i=0;i<column_choices.length;i++){
            if(column_choices[i].type==this.props.columnType){
                title+=column_choices[i].name;
                break;
            }
        }
        return(
            <div class="new-node node-bar-column node-bar-sortable" ref={this.maindiv}>
                {title}
            </div>
        );
    }
    
    
    postMountFunction(){
        this.makeDraggable();
        $(this.maindiv.current)[0].dataDraggable={column:null,column_type:this.props.columnType}
    }
}






export class NodeBarStrategyWorkflow extends ComponentJSON{
    render(){
        let data = this.props.data;
        return null;
    }
}
export const NodeBarStrategyWorkflowConnected = connect(
    mapStrategyWorkflowStateToProps,
    null
)(NodeBarStrategyWorkflow)




export function renderWorkflowView(container){
    reactDom.render(
        <Provider store = {store}>
            <WorkflowViewConnected/>
        </Provider>,
        container
    );
}





