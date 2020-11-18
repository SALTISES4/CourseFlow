import {Component, createRef} from "react";
import * as reactDom from "react-dom";
import * as Redux from "redux";
import * as React from "react";
import {Decimal} from 'decimal.js/decimal';
import {Provider, connect} from 'react-redux';
import {configureStore, createStore} from '@reduxjs/toolkit';
import {dot as mathdot, subtract as mathsubtract, matrix as mathmatrix, add as mathadd, multiply as mathmultiply, norm as mathnorm, isNaN as mathisnan} from "mathjs";


const node_keys=["activity","course","program"];
const columnwidth = 200
const node_ports={
    source:{
        e:[1,0.6],
        w:[0,0.6],
        s:[0.5,1]
    },
    target:{
        n:[0.5,0],
        e:[1,0.4],
        w:[0,0.4]
    }
}
const port_keys=["n","e","s","w"];
const port_direction=[
    [0,-1],
    [1,0],
    [0,1],
    [-1,0]
]
const port_padding=10;
const task_keys = [
    "",
    "research",
    "discuss",
    "problem",
    "analyze",
    "peerreview",
    "debate",
    "play",
    "create",
    "practice",
    "reading",
    "write",
    "present",
    "experiment",
    "quiz",
    "curation",
    "orchestration",
    "instrevaluate",
    "other"
]
const context_keys = [
    "",
    "solo",
    "group",
    "class"
]

//Get translate from an svg transform
function getSVGTranslation(transform){
    var translate = transform.substring(transform.indexOf("translate(")+10, transform.indexOf(")")).split(",");
    return translate;
}

//Get the offset from the canvas of a specific jquery object
function getCanvasOffset(node_dom){
    var node_offset = node_dom.offset();
    var canvas_offset = $(".workflow-canvas").offset();
    node_offset.left-=canvas_offset.left;
    node_offset.top-=canvas_offset.top;
    return node_offset;
}

//Check if the mouse event is within a box with the given padding around the element
function mouseOutsidePadding(evt,elem,padding){
    if(elem.length==0) return true;
    let offset = elem.offset();
    let width = elem.width();
    let height = elem.height();
    return (evt.pageX<offset.left-padding || evt.pageY<offset.top-padding || evt.pageX>offset.left+width+padding || evt.pageY>offset.top+height+padding);
}


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
        }
    }

}

//Creates paths between two ports
export class PathGenerator{
    constructor(source_point,source_port,target_point,target_port,source_dims,target_dims){
        this.point_arrays={source:[source_point],target:[target_point]};
        this.last_point={source:source_point,target:target_point};
        this.direction = {source:port_direction[source_port],target:port_direction[target_port]};
        this.hasTicked = {source:false,target:false};
        this.node_dims = {source:source_dims,target:target_dims};
        this.findcounter=0;
    }
    
    //finds and returns the path
    findPath(){
        try{
            this.findNextPoint();
        }catch(err){console.log("error calculating path")};
        return this.joinArrays();
    }
    
    //Recursively checks to see whether we need to move around a node, if not, we just need to join the arrays
    findNextPoint(){
        if(this.findcounter>8)return;
        this.findcounter++;
        //Determine which case we have:
        if(mathdot(this.direction["source"],mathsubtract(this.last_point["target"],this.last_point["source"]))<0){
            this.tickPerpendicular("source");
            this.findNextPoint();
        }else if(mathdot(this.direction["target"],mathsubtract(this.last_point["source"],this.last_point["target"]))<0){
            this.tickPerpendicular("target");
            this.findNextPoint();
        }
    }
    
    addPoint(point,port="source"){
        this.point_arrays[port].push(point);
        this.last_point[port]=point;
    }
    
    addDelta(delta,port="source"){
        this.addPoint(mathadd(delta,this.last_point[port]),port);
    }
    
    //Pads out away from the node edge
    padOut(port){
        this.addDelta(mathmultiply(port_padding,this.direction[port]),port);
    }
    
    //Turns perpendicular to move around the edge of the node
    tickPerpendicular(port="source"){
        let otherport = "target";
        if(port=="target")otherport="source";
        this.padOut(port);
        var new_direction = mathmultiply(
            mathmatrix(
                [mathmultiply([1,0],this.direction[port][1]**2),
                 mathmultiply([0,1],this.direction[port][0]**2)]
            ),
            mathsubtract(this.last_point[otherport],this.last_point[port])
        )._data;
        let norm = mathnorm(new_direction);
        if(norm==0)throw "Non-numeric";
        this.direction[port]=mathmultiply(1.0/mathnorm(new_direction),new_direction);
        this.addDelta(
            mathmultiply(
                this.getNodeOutline(this.direction[port],port),this.direction[port]
            ),
            port
        );
    }
    
    //Determines how far we need to move in order to move around the edge of the node
    getNodeOutline(direction,port){
        if(this.hasTicked[port]){
            return Math.abs(mathdot(direction,this.node_dims[port]));
        }else{
            this.hasTicked[port]=true;
            return Math.abs(mathdot(direction,this.node_dims[port])/2);
        }
    }

    //joins the two arrays, either as a corner or a double corner
    joinArrays(){
        var joined = this.point_arrays["source"].slice();
        //We have remaining either a corner or both point towards each other
        if(mathdot(this.direction["source"],this.direction["target"])==0){
            //corner
            joined.push(
                [this.direction["source"][0]**2*this.last_point["target"][0]+
                 this.direction["target"][0]**2*this.last_point["source"][0],
                 this.direction["source"][1]**2*this.last_point["target"][1]+
                 this.direction["target"][1]**2*this.last_point["source"][1]]
            )
        }else{
            if(this.hasTicked.source==false&&this.hasTicked.target==false){
                this.padOut("target");
                this.padOut("source");
            }
            //double corner
            let diff = mathsubtract(this.last_point["target"],this.last_point["source"]);
            let mid1=[this.direction["source"][0]**2*diff[0]/2,this.direction["source"][1]**2*diff[1]/2]
            let mid2=[-(this.direction["source"][0]**2)*diff[0]/2,-(this.direction["source"][1]**2)*diff[1]/2]
            joined.push(
                mathadd(this.last_point["source"],mid1)
            )
            joined.push(
                mathadd(this.last_point["target"],mid2)
            )
        }
        for(var i=this.point_arrays["target"].length-1;i>=0;i--){
            joined.push(this.point_arrays["target"][i]);
        }
        return joined;
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

const deleteSelfAction = (id,parentID,objectType,extra_data) => {
    return {
        type: objectType+"/deleteSelf",
        payload:{id:id,parent_id:parentID,extra_data:extra_data}
    }
}

const insertBelowAction = (response_data,objectType) => {
    return {
        type: objectType+"/insertBelow",
        payload:response_data
    }
}

const setLinkedWorkflowAction = (response_data) => {
    return {
        type: "node/setLinkedWorkflow",
        payload:response_data
    }
}

const newNodeAction = (response_data) => {
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

const newNodeLinkAction = (response_data) => {
    return {
        type: 'nodelink/newNodeLink',
        payload:response_data
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
            let json = {};
            json[action.payload.field]=action.payload.value;
            updateValue(action.payload.id,"workflow",json);
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
                    let json = {};
                    json[action.payload.field]=action.payload.value;
                    updateValue(action.payload.id,"column",json);
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
            insertedAt(action.payload.id,"nodestrategy",new_parent.id,new_index);
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
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.parentID){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]}
                    var new_nodestrategy_set = state[i].nodestrategy_set.slice();
                    new_nodestrategy_set.splice(action.payload.index,0,action.payload.new_through.id);
                    new_state[i].nodestrategy_set = new_nodestrategy_set;
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
                    let json = {};
                    json[action.payload.field]=action.payload.value;
                    updateValue(action.payload.id,"strategy",json);
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
        case 'column/deleteSelf':
            var new_state = state.slice();
            var new_columnworkflow;
            if(action.payload.extra_data){
                new_columnworkflow = action.payload.extra_data[0];
                if(new_columnworkflow==action.payload.parent_id)new_columnworkflow=action.payload.extra_data[1];
            }
            
            for(var i=0;i<state.length;i++){
                console.log(action.payload);
                console.log(state[i]);
                if(state[i].columnworkflow==action.payload.parent_id){
                    console.log("column deleted, moving nodes");
                    new_state[i]={...state[i]};
                    new_state[i].columnworkflow=new_columnworkflow;
                }
            }
            return new_state;
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
        case 'nodelink/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].outgoing_links.indexOf(action.payload.id)>=0){
                    var new_state=state.slice();
                    new_state[i] = {...new_state[i]};
                    new_state[i].outgoing_links = state[i].outgoing_links.slice();
                    new_state[i].outgoing_links.splice(new_state[i].outgoing_links.indexOf(action.payload.id),1);
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
            console.log("field changed");
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]};
                    new_state[i][action.payload.field]=action.payload.value;
                    let json = {};
                    json[action.payload.field]=action.payload.value;
                    updateValue(action.payload.id,"node",json);
                    return new_state;
                }
            }
            return state;
        case 'node/setLinkedWorkflow':
            console.log("setting the linked workflow");
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]};
                    new_state[i].linked_workflow=action.payload.linked_workflow;
                    new_state[i].linked_workflow_title = action.payload.linked_workflow_title;
                    return new_state;
                }
            }
            return state;
        case 'nodelink/newNodeLink':
            console.log("creating nodelink in node");
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.new_model.source_node){
                    var new_state = state.slice();
                    new_state[i] = {...state[i]}
                    var new_outgoing_links = state[i].outgoing_links.slice();
                    new_outgoing_links.push(action.payload.new_model.id);
                    new_state[i].outgoing_links = new_outgoing_links;
                    console.log(new_state);
                    return new_state;
                }
            }
            return state;
        default:
            return state;
    }
}
function nodelinkReducer(state={},action){
    switch(action.type){
        case 'node/insertBelow':
        case 'node/newNode':
        case 'node/deleteSelf':
            return state;
        case 'nodelink/newNodeLink':
            console.log("creating node link");
            new_state = state.slice();
            new_state.push(action.payload.new_model);
            return new_state;
        case 'nodelink/deleteSelf':
            for(var i=0;i<state.length;i++){
                if(state[i].id==action.payload.id){
                    var new_state = state.slice();
                    new_state.splice(i,1);
                    deleteSelf(action.payload.id,"nodelink")
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
    nodelink:nodelinkReducer,
});

const store = createStore(rootReducer,initial_data);

const getColumnByID = (state,id)=>{
    for(var i in state.column){
        var column = state.column[i];
        if(column.id==id)return {data:column,sibling_count:state.workflow.columnworkflow_set.length,columnworkflows:state.workflow.columnworkflow_set};
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
        if(strategy.id==id)return {data:strategy,column_order:state.workflow.columnworkflow_set,sibling_count:state.workflow.strategyworkflow_set.length};
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
const getNodeLinkByID = (state,id)=>{
    for(var i in state.nodelink){
        var nodelink = state.nodelink[i];
        if(nodelink.id==id)return {data:nodelink};
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
        if(initial_loading)$(document).triggerHandler("component-loaded",this.objectType);
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
                $(document).triggerHandler(draggable_type+"-dropped");
            
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
                if(drag_item.hasClass("new-node")){
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
                $(".workflow-canvas").removeClass("dragging-"+draggable_type);
                $(draggable_selector).removeClass("dragging");
                var object_id = parseInt(ui.item.attr("id"));
                var new_position = ui.item.prevAll().length;
                var new_parent_id = parseInt(ui.item.parent().attr("id"));
                $(draggable_selector).removeClass("dragging");
                //Automatic scroll, useful when moving weeks that shrink significantly to make sure the dropped item is kept in focus. This should be updated to only scroll if the item ends up outside the viewport, and to scroll the minimum amount to keep it within.
                $("#container").animate({
                    scrollTop: ui.item.offset().top-200
                },20);
                $(document).triggerHandler(draggable_type+"-dropped");
                this.stopSortFunction();
            }
        });
    }
    
    //Adds a button that deltes the item (with a confirmation). The callback function is called after the object is removed from the DOM
    addDeleteSelf(data){
        return (
            <ActionButton button_icon="delrect.svg" button_class="delete-self-button" handleClick={()=>{
                //Temporary confirmation; add better comfirmation dialogue later
                if((this.objectType=="strategy"||this.objectType=="column")&&this.props.sibling_count<2){
                    alert("You cannot delete the last "+this.objectType);
                    return;
                }
                if(window.confirm("Are you sure you want to delete this "+this.objectType+"?")){
                    this.props.dispatch(deleteSelfAction(data.id,this.props.throughParentID,this.objectType,this.props.columnworkflows));
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
            var props = this.props;
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
                        {type=="node" &&
                            <div>
                                <h4>Context:</h4>
                                <select value={data.context_classification} onChange={this.inputChanged.bind(this,"context_classification")}>
                                    {context_choices.map((choice)=>
                                        <option value={choice.type}>{choice.name}</option>
                                    )}
                                </select>
                            </div>
                        }
                        {type=="node" &&
                            <div>
                                <h4>Task:</h4>
                                <select value={data.task_classification} onChange={this.inputChanged.bind(this,"task_classification")}>
                                    {task_choices.map((choice)=>
                                        <option value={choice.type}>{choice.name}</option>
                                    )}
                                </select>
                            </div>
                        }
                        {type=="node" && data.node_type!=0 &&
                            <div>
                                <h4>Linked Workflow:</h4>
                                <div>{data.linked_workflow_title}</div>
                                <button onClick={()=>{getLinkedWorkflowMenu(data,(response_data)=>{
                                    let action = setLinkedWorkflowAction(response_data);
                                    props.dispatch(action);
                                })}}>
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

export class NodeLinkSVG extends Component{
    render(){
        
        console.log("rendering svg");
        console.log(this.props.source_port_handle);
        console.log(getSVGTranslation(this.props.source_port_handle.select(function(){
            return this.parentNode}).attr("transform")));
        
        const source_transform=getSVGTranslation(this.props.source_port_handle.select(function(){
            return this.parentNode}).attr("transform"));
        const target_transform=getSVGTranslation(this.props.target_port_handle.select(function(){
            return this.parentNode}).attr("transform"));
        const source_point=[parseInt(this.props.source_port_handle.attr("cx"))+parseInt(source_transform[0]),parseInt(this.props.source_port_handle.attr("cy"))+parseInt(source_transform[1])];
        const target_point=[parseInt(this.props.target_port_handle.attr("cx"))+parseInt(target_transform.[0]),parseInt(this.props.target_port_handle.attr("cy"))+parseInt(target_transform[1])];

        var path_array = this.getPathArray(source_point,this.props.source_port,target_point,this.props.target_port);
        var path=(this.getPath(path_array));

        return (
            <g fill="none" stroke="black">
                <path opacity="0" stroke-width="10px" d={path} onClick={this.props.clickFunction} class={"nodelink"+((this.props.selected && " selected")||"")}/>
                <path stroke-width="2px" d={path} marker-end="url(#arrow)"/>
            </g>
        );
    }
    
    getPathArray(source_point,source_port,target_point,target_port){
        var source_dims = [this.props.source_dimensions.width,this.props.source_dimensions.height];
        var target_dims = [this.props.target_dimensions.width,this.props.target_dimensions.height];
        var path_generator = new PathGenerator(source_point,source_port,target_point,target_port,source_dims,target_dims);
        return path_generator.findPath();
    }

    getPath(path_array){
        var path="M";
        for(var i=0;i<path_array.length;i++){
            if(i>0)path+=" L";
            var thispoint = path_array[i];
            path+=thispoint[0]+" "+thispoint[1];
        }
        return path;
    }
}
//Basic component to represent a NodeLink
export class NodeLinkView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="nodelink";
        this.objectClass=".node-link";
        this.rerenderEvents = "ports-rendered."+this.props.data.id;
    }
    
    render(){
        let data = this.props.data;
        if(!this.source_node||!this.source_node.width()||!this.target_node||!this.target_node.width()){
            this.source_node = $(this.props.node_div.current);
            this.source_port_handle = d3.select(
                "g.port-"+data.source_node+" circle[data-port-type='source'][data-port='"+port_keys[data.source_port]+"']"
            );
            this.target_node = $("#"+data.target_node+".node");
            this.target_port_handle = d3.select(
                "g.port-"+data.target_node+" circle[data-port-type='target'][data-port='"+port_keys[data.target_port]+"']"
            );
            this.source_node.on(this.rerenderEvents,this.rerender.bind(this));
            this.target_node.on(this.rerenderEvents,this.rerender.bind(this));
        }
        
        console.log(this.source_node);
        console.log(this.source_node.length);
        console.log(this.target_node);
        console.log(this.target_node.length);
        var source_dims = {width:this.source_node.width(),height:this.source_node.height()};
        var target_dims = {width:this.target_node.width(),height:this.target_node.height()};
        console.log("found the dimensions");
        if(!source_dims.width||!target_dims.width)return null;
        var selector=this;
        console.log("creating portal");
        return(
            <div>
                {reactDom.createPortal(
                    <NodeLinkSVG source_port_handle={this.source_port_handle} source_port={data.source_port} target_port_handle={this.target_port_handle} target_port={data.target_port} clickFunction={(evt)=>selection_manager.changeSelection(evt,selector)} selected={this.state.selected} source_dimensions={source_dims} target_dimensions={target_dims}/>
                    ,$(".workflow-canvas")[0])}
                {this.addEditable(data)}
            </div>
        );
    }
    
    
    rerender(){
        this.setState({});
    }

    componentDidUnmount(){
        if(this.target_node&&this.target_node.length>0){
            this.source_node.off(this.rerenderEvents);
            this.target_node.off(this.rerenderEvents);
        }
    }
}
const mapNodeLinkStateToProps = (state,own_props)=>(
    getNodeLinkByID(state,own_props.objectID)
)
const mapNodeLinkDispatchToProps = {};
export const NodeLinkViewConnected = connect(
    mapNodeLinkStateToProps,
    null
)(NodeLinkView)

export class AutoLinkView extends Component{
    constructor(props){
        super(props);
        this.eventNameSpace="autolink"+props.nodeID;
        this.rerenderEvents = "ports-rendered."+this.eventNameSpace;
    }
    
    render(){
        console.log("rendering autolink");
        if(!this.source_node||this.source_node.length==0){
            this.source_node = $(this.props.node_div.current);
            this.source_port_handle = d3.select(
                "g.port-"+this.props.nodeID+" circle[data-port-type='source'][data-port='s']"
            );
            this.source_node.on(this.rerenderEvents,this.rerender.bind(this));
        }
        if(this.target_node&&this.target_node.parent().parent().length==0)this.target_node=null;
        this.findAutoTarget();
        console.log(this.target_node);
        if(!this.target_node)return null;
        var source_dims = {width:this.source_node.width(),height:this.source_node.height()};
        var target_dims = {width:this.target_node.width(),height:this.target_node.height()};
        return(
            <div>
                {reactDom.createPortal(
                    <NodeLinkSVG source_port_handle={this.source_port_handle} source_port="2" target_port_handle={this.target_port_handle} target_port="0" source_dimensions={source_dims} target_dimensions={target_dims}/>
                    ,$(".workflow-canvas")[0])}
            </div>
        );
    }

    findAutoTarget(){
        var ns = this.source_node.closest(".node-strategy");
        var next_ns = ns.nextAll(".node-strategy:not(.ui-sortable-placeholder)").first();
        var target;
        if(next_ns.length>0){
            target = next_ns.find(".node").attr("id");
        }else{
            var sw = ns.closest(".strategy-workflow");
            var next_sw = sw.next();
            while(next_sw.length>0){
                target = next_sw.find(".node-strategy:not(ui-sortable-placeholder) .node").attr("id");
                if(target)break;
                next_sw = next_sw.next();
            }
        }
        this.setTarget(target);
    }

    rerender(){
        this.setState({});
    }

    setTarget(target){
        if(target){
            if(this.target_node&&target==this.target_node.attr("id"))return;
            if(this.target_node)this.target_node.off(this.rerenderEvents);
            this.target_node = $(".strategy #"+target+".node");
            this.target_port_handle = d3.select(
                "g.port-"+target+" circle[data-port-type='target'][data-port='n']"
            );
            this.target_node.on(this.rerenderEvents,this.rerender.bind(this));
            this.target=target;
        }else{
            if(this.target_node)this.target_node.off(this.rerenderEvents);
            this.target_node=null;
            this.target_port_handle=null;
            this.target=null;
        }
    } 

    /*componentDidUnmount(){
        if(this.target_node&&this.target_node.length>0){
            this.source_node.off(this.rerenderEvents);
            this.target_node.off(this.rerenderEvents);
        }
    }*/
}


//The ports used to connect links for the nodes
export class NodePorts extends Component{
    constructor(props){
        super(props);
        this.state={};
    }
    
    render(){
        var ports = [];
        var node_dimensions;
        if(this.state.node_dimensions){
            node_dimensions=this.state.node_dimensions;
            this.positioned = true;
        }
        else node_dimensions={width:0,height:0};
        for(var port_type in node_ports)for(var port in node_ports[port_type]){
            ports.push(
                <circle data-port-type={port_type} data-port={port} data-node-id={this.props.nodeID} r="6" key={port_type+port} 
                cx={node_ports[port_type][port][0]*node_dimensions.width} 
                cy={node_ports[port_type][port][1]*node_dimensions.height}/>
            )
        }
        var transform;
        if(this.state.node_offset)transform = "translate("+this.state.node_offset.left+","+this.state.node_offset.top+")"
        else transform = "translate(0,0)";
        return(
            <g class={'node-ports port-'+this.props.nodeID} stroke="black" stroke-width="2" fill="white" transform={transform}>
                {ports}
            </g>
        )
    }
    
    componentDidMount(){
        console.log("ports mounted");
        var thisComponent=this;
        d3.selectAll(
            'g.port-'+this.props.nodeID+" circle[data-port-type='source']"
        ).call(d3.drag().on("start",function(d){
            $(".workflow-canvas").addClass("creating-node-link");
            var canvas_offset = $(".workflow-canvas").offset();
            d3.select(".node-link-creator").remove();
            d3.select(".workflow-canvas").append("line").attr("class","node-link-creator").attr("x1",event.x-canvas_offset.left).attr("y1",event.y-canvas_offset.top).attr("x2",event.x-canvas_offset.left).attr("y2",event.y-canvas_offset.top).attr("stroke","red").attr("stroke-width","2");
        }).on("drag",function(d){
            var canvas_offset = $(".workflow-canvas").offset();
            d3.select(".node-link-creator").attr("x2",event.x-canvas_offset.left).attr("y2",event.y-canvas_offset.top);
        }).on("end",function(d){
            $(".workflow-canvas").removeClass("creating-node-link");
            var target = d3.select(event.target);
            if(target.attr("data-port-type")=="target"){
                thisComponent.nodeLinkAdded(target.attr("data-node-id"),d3.select(this).attr("data-port"),target.attr("data-port"));
            }
            d3.select(".node-link-creator").remove();
        }));
        this.updatePorts();
        $(this.props.node_div.current).on("component-updated",this.updatePorts.bind(this));
        $(document).triggerHandler("ports-rendered");
    }
    
    updatePorts(){
        if(!this.props.node_div.current)return;
        var node = $(this.props.node_div.current);
        var node_offset = getCanvasOffset(node);
        var node_dimensions={width:node.width(),height:node.height()};
        //if(node.closest(".strategy-workflow").hasClass("dragging")||this.state.node_offset==node_offset&&this.state.node_dimensions==node_dimensions)return;
        this.setState({node_offset:node_offset,node_dimensions:node_dimensions});
    }
    
    componentDidUpdate(){
        $(this.props.node_div.current).triggerHandler("ports-rendered");
    }
    
    nodeLinkAdded(target,source_port,target_port){
        var props=this.props;
        newNodeLink(this.props.nodeID,target,port_keys.indexOf(source_port),port_keys.indexOf(target_port),(response_data)=>{
            let action = newNodeLinkAction(response_data);
            props.dispatch(action);
        });
    }
}

//Basic component to represent a Node
export class NodeView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="node";
        this.objectClass=".node";
        this.state={
            is_dropped:false,
            initial_render:true
        }
    }
    
    render(){
        let data = this.props.data;
        var nodePorts;
        var node_links;
        var auto_link;
        console.log("rendering node");
        console.log(data);
        console.log(this.maindiv);
        if(!this.state.initial_render)nodePorts = reactDom.createPortal(
                <NodePorts nodeID={this.props.objectID} node_div={this.maindiv} dispatch={this.props.dispatch}/>
            ,$(".workflow-canvas")[0]
        );
        if(ports_rendered&&!this.state.port_render){
            node_links = data.outgoing_links.map((link)=>
                <NodeLinkViewConnected key={link} objectID={link} node_div={this.maindiv}/>
            );
            if(data.has_autolink)auto_link = (
                <AutoLinkView nodeID={this.props.objectID} node_div={this.maindiv}/>
            );
        }
        var lefticon;
        var righticon;
        if(data.context_classification>0)lefticon=(
            <img src={iconpath+context_keys[data.context_classification]+".svg"}/>
        )
        if(data.task_classification>0)righticon=(
            <img src={iconpath+task_keys[data.task_classification]+".svg"}/>
        )
        
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
                        {lefticon}
                    </div>
                    <div class = "node-title">
                        <TitleText text={data.title} defaultText="New Node"/>
                    </div>
                    <div class = "node-icon">
                        {righticon}
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
                {nodePorts}
                {node_links}
                {auto_link}
            </div>
        );


    }
    
    postMountFunction(){
        $(this.maindiv.current).on("mouseenter",this.mouseIn.bind(this));
        $(document).on("render-ports render-links",()=>{this.setState({})});
        if(this.state.initial_render)this.setState({initial_render:false,port_render:true});
    }

    componentDidUpdate(){
        this.updatePorts();
        if(this.state.port_render)this.setState({initial_render:false,port_render:false});
    }

    updatePorts(){
        $(this.maindiv.current).triggerHandler("component-updated");
    }
    
    toggleDrop(){
        this.setState({is_dropped:!this.state.is_dropped},()=>triggerHandlerEach($(".node"),"component-updated"));
    }

    mouseIn(evt){
        if(evt.which==1)return;
        $("circle[data-node-id='"+this.props.objectID+"'][data-port-type='source']").addClass("mouseover");
        d3.selectAll(".node-ports").raise();
        var mycomponent = this;
        
        $(document).on("mousemove",function(evt){
            if(!mycomponent||!mycomponent.maindiv||mouseOutsidePadding(evt,$(mycomponent.maindiv.current),20)){
                $("circle[data-node-id='"+mycomponent.props.objectID+"'][data-port-type='source']").removeClass("mouseover");
                $(document).off(evt);
            }
        });
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
        triggerHandlerEach($(this.maindiv.current).find(".node"),"component-updated");
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
        //this.props.dispatch(moveNodeStrategy(id,new_position,new_parent,this.props.nodes_by_column))
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

    stopSortFunction(){
        triggerHandlerEach($(".strategy .node"),"component-updated");
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
        var nodebarcolumnworkflows = data.columnworkflow_set.map((columnworkflow)=>
            <NodeBarColumnWorkflowConnected key={columnworkflow} objectID={columnworkflow}/>
        );
        var columns_present = this.props.columns.map(col=>col.column_type);
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

export function renderMessageBox(data,type,updateFunction){
    reactDom.render(
        <MessageBox message_data={data} message_type={type} actionFunction={updateFunction}/>,
        $("#popup-container")[0]
    );
}

export function closeMessageBox(){
    reactDom.render(null,$("#popup-container")[0]);
}

export class MessageBox extends Component{
    render(){
        var menu;
        if(this.props.message_type=="linked_workflow_menu")menu=(
            <WorkflowsMenu type={this.props.message_type} data={this.props.message_data} actionFunction={this.props.actionFunction}/>
        );
        return(
            <div class="screen-barrier" onClick={(evt)=>evt.stopPropagation()}>
                <div class="message-box">
                    {menu}
                </div>
            </div>
        );
    }
}

export class WorkflowsMenu extends Component{
    constructor(props){
        super(props);
        this.state={};
    }
    
    render(){
        var project_workflows = this.props.data.project_workflows.map((project_workflow)=>
                <WorkflowForMenu key={project_workflow.id} type={this.props.type} owned={true} in_project={true} workflow_data={project_workflow} selected={(this.state.selected==project_workflow.id)} selectAction={this.workflowSelected.bind(this,project_workflow.id,"project")}/>
            );
        var other_workflows = this.props.data.other_workflows.map((other_workflow)=>
                <WorkflowForMenu key={other_workflow} type={this.props.type} owned={true} in_project={true} workflow_data={other_workflow} selected={(this.state.selected==other_workflow.id)} selectAction={this.workflowSelected.bind(this,other_workflow.id,"other")}/>
            );
        var published_workflows = this.props.data.published_workflows.map((published_workflow)=>
                <WorkflowForMenu key={published_workflow} type={this.props.type} owned={true} in_project={false} workflow_data={published_workflow} selected={(this.state.selected==published_workflow.id)} selectAction={this.workflowSelected.bind(this,published_workflow.id,"published")}/>
            );
        
        return(
            <div class="message-wrap">
                <div class="message-panel">
                    <h2>From this project:</h2>
                    {project_workflows}
                </div>
                <div class="message-panel">
                    <h2>From your other projects:</h2>
                    {other_workflows}
                    <h2>From other published projects:</h2>
                    {published_workflows}
                </div>
                <div class="action-bar">
                    {this.getActions()}
                </div>
            </div>
        );
    }
    
    workflowSelected(selected_id,selected_type){
        this.setState({selected:selected_id,selected_type:selected_type});
    }

    getActions(){
        var actions = [];
        if(this.props.type=="linked_workflow_menu"){
            var text="link to node";
            if(this.state.selected && this.state.selected_type!="project")text="copy to current project and "+text;
            actions.push(
                <button disabled={!this.state.selected} onClick={()=>{
                    setLinkedWorkflow(this.props.data.node_id,this.state.selected,this.props.actionFunction)
                    closeMessageBox();
                }}>
                    {text}
                </button>
            );
            actions.push(
                <button onClick={()=>{
                    setLinkedWorkflow(this.props.data.node_id,-1,this.props.actionFunction)
                    closeMessageBox();
                }}>
                    set to none
                </button>
            );
            actions.push(
                <button onClick={closeMessageBox}>
                    cancel
                </button>
            );
        }
        return actions;
    }
}

export class WorkflowForMenu extends Component{
    render(){
        var data = this.props.workflow_data;
        var css_class = "workflow-for-menu";
        if(this.props.selected)css_class+=" selected";
        return(
            <div class={css_class} onClick={this.props.selectAction}>
                <div class="workflow-title">
                    {data.title}
                </div>
                <div class="workflow-created">
                    { "Created"+(data.author && " by "+data.author)+" on "+data.created_on}
                </div>
                <div class="activity-description">
                    {data.description}
                </div>
            </div>
        );
    }
}




