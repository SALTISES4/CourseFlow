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

const moveColumnWorkflow = (id,new_position) => {
    return {
        type: 'columnworkflow/movedTo',
        payload:{id:id,new_index:new_position}
    }
}

function workflowReducer(state={},action){
    switch(action.type){
        case 'workflow/setInitialState':
            console.log(state);
            console.log(action);
            return action.payload
        case 'columnworkflow/movedTo':
            var new_columnworkflow_set = state.columnworkflow_set.slice();
            for(var i=0;i<new_columnworkflow_set.length;i++){
                console.log("id comparison:");
                console.log(new_columnworkflow_set[i]);
                console.log(action.payload.id);
                console.log(action.payload.new_index);
                if(new_columnworkflow_set[i].id==action.payload.id){
                    console.log("FOUND IT");
                    new_columnworkflow_set.splice(action.payload.new_index,0,new_columnworkflow_set.splice(i,1)[0]);
                    break;
                }
            }
            for(var i=0;i<new_columnworkflow_set.length;i++){
                new_columnworkflow_set[i]={...new_columnworkflow_set[i],rank:i};
            }
            console.log(new_columnworkflow_set);
            return {
                ...state,
                columnworkflow_set:new_columnworkflow_set
            }
        default:
            return state;
    }
}

const rootReducer = Redux.combineReducers({
    workflow:workflowReducer,
});

const store = createStore(rootReducer);

const getColumnByID = (state,id)=>{
    for(var i in state.workflow.columnworkflow_set){
        var columnworkflow = state.workflow.columnworkflow_set[i];
        if(columnworkflow.column.id==id)return {data:columnworkflow.column};
    }
}
const getColumnWorkflowByID = (state,id)=>{
    for(var i in state.workflow.columnworkflow_set){
        console.log(id);
        var columnworkflow = state.workflow.columnworkflow_set[i];
        console.log(state.workflow.columnworkflow_set[i]);
        if(columnworkflow.id==id)return {data:columnworkflow};
    }
}

//Extends the react component to add a few features that are used in a large number of components
export class ComponentJSON extends Component{
    constructor(props){
        super(props);
        this.state={};
    }
    
    componentDidMount(){
        this.postMountFunction();
    }
    
    postMountFunction(){};
    
    makeSortable(sortable_block,parent_id,draggable_type,draggable_selector,axis=false,grid=false,connectWith="",handle=false){
        sortable_block.sortable({
            containment:".workflow-container",
            axis:axis,
            cursor:"move",
            grid:grid,
            cursorAt:{top:20},
            connectWith:connectWith,
            handle:handle,
            tolerance:"pointer",
            distance:10,
            start:(e,ui)=>{
                sortable_block.data("last_order",sortable_block.sortable("toArray"));
                $(".workflow-canvas").addClass("dragging-"+draggable_type);
                $(draggable_selector).addClass("dragging");
                //Calls a refresh of the sortable in case adding the draggable class resized the object (which it does in many cases)
                sortable_block.sortable("refresh");
                //If the handle exists, the item should wrap around it to make it "smaller"
                var sort = $(sortable_block).sortable("instance");
                if(handle){
                    var restriction_handle = $(sort.currentItem).children(handle);
                    restriction_handle=restriction_handle[0];
                    sort.containment[0]-=restriction_handle.offsetLeft;
                    sort.containment[2]+=sort.currentItem[0].offsetWidth-restriction_handle.offsetWidth-restriction_handle.offsetLeft;
                }
                //Fix the vertical containment. This is especially necessary when the item resizes.
                sort.containment[3]+=sort.currentItem[0].offsetTop;
                
            },
            //Tell the dragging object that we are dragging it
            sort:(e,ui)=>{
                //figure out if the order has changed
                if(ui.placeholder.parent()[0]!=ui.item.parent()[0]||ui.item.prevAll().not(".ui-sortable-placeholder").length!=ui.placeholder.prevAll().not(".ui-sortable-helper").length){
                    //move the item if needed
                    var old_siblings;
                    if(ui.item.parent()!=ui.placeholder.parent())old_siblings=ui.item.siblings(draggable_selector);
                    console.log("AN ITEM WAS MOVED IN A SORTABLE")
                    //ui.item.insertAfter(ui.placeholder); 
                    //if(old_siblings)triggerHandlerEach(old_siblings,"sorted");
                    //triggerHandlerEach(ui.item.siblings(draggable_selector),"sorted");
                }
                ui.item.triggerHandler("dragging");
            },
            //When the object is removed from this list, ensure the state is updated.
            remove:(evt,ui)=>{
                var object_id = ui.item[0].id;
                console.log("AN ITEM WAS REMOVED FROM A SORTABLE");
                //this.childRemoved.bind(this)(draggable_type,parseInt(object_id));
            },
            //When the object is received by this list, ensure the state is updated
            receive:(evt,ui)=>{
                var object_id = ui.item[0].id;
                var new_position = ui.item.index();
                console.log("AN ITEM WAS RECEIVED IN A SORTABLE");
                //if(ui.item[0].classList.contains("node-bar-sortable"))this.newChild.bind(this)(draggable_type,parent_id,new_position,ui);
                //else this.childAdded.bind(this)(draggable_type,parseInt(object_id),new_position);
            },
            stop:(evt,ui)=>{
                console.log("WE STOPPED SORTING");
                var object_id = ui.item.attr("id");
                var new_position = ui.item.prevAll().length;
                $(draggable_selector).removeClass("dragging");
                this.stopSortFunction(object_id,new_position);
                return;
                //Fetch information about the object that was moved
                var new_parent_id = parseInt(ui.item[0].parentElement.id);
                //If the object was moved within this list, ensure state update
                if(new_parent_id==parent_id)this.childAdded.bind(this)(draggable_type,parseInt(object_id),new_position); 
                //Automatic scroll, useful when moving weeks that shrink significantly to make sure the dropped item is kept in focus. This should be updated to only scroll if the item ends up outside the viewport, and to scroll the minimum amount to keep it within.
                $("#container").animate({
                    scrollTop: ui.item.offset().top-200
                },20);
                var newColumnID=-1;
                //Check if the parent strategy is a term
                if(draggable_type=="nodestrategy"){
                    //Calculate the horizontal displacement, used for changing columns
                    var delta_x = Math.round((ui.position.left-ui.originalPosition.left)/columnwidth);
                    //If this is a node, figure out which column it has been moved into and update the state. This is unfortunately a case that's very difficult to do without using our escape hatch to access the react component from the div
                    if(delta_x){
                        var child = ui.item.children(".node");
                        var columnID=child[0].react.state.columnworkflow;
                        try{
                            newColumnID=columns[columns.indexOf(columnID)+delta_x];
                            if(newColumnID){
                                child[0].react.setState({columnworkflow:newColumnID})
                            }
                        }catch(err){console.log("could not change column")}
                        console.log(columnID);
                    }
                }
                
                //Call the update to the server, with a callback function that triggers an event signifying a change of order
                insertedAt(
                    object_id,
                    draggable_type,
                    parent_id,
                    new_position,
                    new_parent_id,
                    newColumnID,
                    ()=>{
                        triggerHandlerEach($(draggable_selector),"sorted");
                        $(".workflow-canvas").removeClass("dragging-"+draggable_type);
                    }
                );
            }
        });
    }
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
        console.log(data);
        var title = data.title;
        if(!title)title=data.column_type_display;
        return (
            <div class={"column"+((this.state.selected && " selected")||"")} onClick={(evt)=>selection_manager.changeSelection(evt,this)}>
                {title}
            </div>
        );
    }
}
/*const mapColumnStateToProps = (state,own_props)=>(
    getColumnByID(state,own_props.objectID)
)
const mapColumnDispatchToProps = {};
export const ColumnViewConnected = connect(
    mapColumnStateToProps,
    null
)(ColumnView)*/

//Basic component to represent a columnworkflow
export class ColumnWorkflowView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="columnworkflow";
        this.objectClass=".column-workflow";
    }
    
    render(){
        let data = this.props.data;
        console.log(data);
        console.log(this.props);
        return (
            <div class={"column-workflow column-"+data.id} ref={this.maindiv} id={data.id}>
                <ColumnView data={data.column}/>
            </div>
        )
    }
}
/*const mapColumnWorkflowStateToProps = (state,own_props)=>(
    getColumnWorkflowByID(state,own_props.objectID)
)
const mapColumnWorkflowDispatchToProps = {};
export const ColumnWorkflowViewConnected = connect(
    mapColumnWorkflowStateToProps,
    null
)(ColumnWorkflowView)*/

//Basic component representing the workflow
export class WorkflowView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.nodebar = createRef();
    }
    
    render(){
        console.log("RENDERING WF");
        console.log(this.props.data);
        let data = this.props.data;
        var columnworkflows = data.columnworkflow_set.map((columnworkflow)=>
            <ColumnWorkflowView key={columnworkflow.id} data={columnworkflow}/>
        );
        /*var strategyworkflows = data.strategyworkflow_set.map((strategyworkflow)=>
            <StrategyWorkflowViewConnected key={strategyworkflow} objectID={strategyworkflow}/>
        );*/
        
        return(
            <div id="workflow-wrapper" class="workflow-wrapper">
                <div class = "workflow-container">
                    <div class="workflow-details">
                        <div class="column-row">
                            {columnworkflows}
                        </div>
                    </div>
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
    }
    
    
    stopSortFunction(id,new_position){
        this.props.dispatch(moveColumnWorkflow(id,new_position))
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





