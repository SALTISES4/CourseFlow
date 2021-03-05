import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON, NodeLinkSVG, AutoLinkView, NodePorts, TitleText} from "./ComponentJSON.js";
import NodeLinkView from "./NodeLinkView.js";
import OutcomeNodeView from "./OutcomeNode.js";
import {getNodeByID} from "./FindState.js";
import * as Constants from "./Constants.js";
import {changeField, addOutcomeToNodeAction} from "./Reducers.js";
import {addOutcomeToNode} from "./PostFunctions.js"


//Basic component to represent a Node
class NodeView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="node";
        this.objectClass=".node";
        this.state={
            initial_render:true
        }
    }
    
    render(){
        let data = this.props.data;
        var nodePorts;
        var node_links;
        var auto_link;
        if(!this.state.initial_render)nodePorts = reactDom.createPortal(
                <NodePorts nodeID={this.props.objectID} node_div={this.maindiv} dispatch={this.props.dispatch}/>
            ,$(".workflow-canvas")[0]
        );
        if(ports_rendered&&!this.state.port_render){
            node_links = data.outgoing_links.map((link)=>
                <NodeLinkView key={link} objectID={link} node_div={this.maindiv} selection_manager={this.props.selection_manager}/>
            );
            if(data.has_autolink)auto_link = (
                <AutoLinkView nodeID={this.props.objectID} node_div={this.maindiv}/>
            );
        }
        let outcomenodes = data.outcomenode_set.map((outcomenode)=>
            <OutcomeNodeView key={outcomenode} objectID={outcomenode}/>
        );
        let outcomeDiv;
        if(outcomenodes.length>0){
            outcomeDiv = (
                <div class="outcome-node-indicator">
                    <div class={"outcome-node-indicator-number column-"+data.columnworkflow}>{outcomenodes.length}</div>
                    <div class={"outcome-node-container column-"+data.columnworkflow}>{outcomenodes}</div>
                </div>
            );
        }
        let lefticon;
        let righticon;
        if(data.context_classification>0)lefticon=(
            <img src={iconpath+Constants.context_keys[data.context_classification]+".svg"}/>
        )
        if(data.task_classification>0)righticon=(
            <img src={iconpath+Constants.task_keys[data.task_classification]+".svg"}/>
        )
        let dropIcon;
        if(data.is_dropped)dropIcon = "droptriangleup";
        else dropIcon = "droptriangledown";
        let linkIcon;
        if(data.linked_workflow)linkIcon=(
            <img src={iconpath+"wflink.svg"}/>
        );
        let dropText = "";
        if(data.description&&data.description.replace(/(<p\>|<\/p>|<br>|\n| |[^a-zA-Z0-9])/g,'')!='')dropText="...";
        let titleText = data.title;
        if(data.represents_workflow)titleText = data.linked_workflow_title;
        let descriptionText = data.description;
        if(data.represents_workflow)descriptionText = data.linked_workflow_description;
        
        
        return (
            <div 
                style={
                    {left:Constants.columnwidth*this.props.column_order.indexOf(data.columnworkflow)+"px"}
                } 
                class={
                    "node column-"+data.columnworkflow+((this.state.selected && " selected")||"")+((data.is_dropped && " dropped")||"")+" "+Constants.node_keys[data.node_type]
                } 
                id={data.id} 
                ref={this.maindiv} 
                onClick={(evt)=>this.props.selection_manager.changeSelection(evt,this)}
            >
                <div class = "node-top-row">
                    <div class = "node-icon">
                        {lefticon}
                    </div>
                    <div class = "node-title">
                        <TitleText text={titleText} defaultText="New Node"/>
                    </div>
                    <div class = "node-icon">
                        {righticon}
                    </div>
                </div>
                <div class = "node-details">
                    <TitleText text={descriptionText} defaultText="Click to edit"/>
                </div>
                <div class = "node-drop-row" onClick={this.toggleDrop.bind(this)}>
                    <div class = "node-drop-side node-drop-left">{dropText}</div>
                    <div class = "node-drop-middle"><img src={iconpath+dropIcon+".svg"}/></div>
                    <div class = "node-drop-side node-drop-right">
                        <div class="node-drop-time">{data.time_required && (data.time_required+" "+time_choices[data.time_units].name)}</div>
                        {linkIcon}
                    </div>
                </div> 
                {!read_only && <div class="mouseover-actions">
                    {this.addInsertSibling(data)}
                    {this.addDuplicateSelf(data)}
                    {this.addDeleteSelf(data)}
                </div>
                }
                {this.addEditable(data)}
                {nodePorts}
                {node_links}
                {auto_link}
                {outcomeDiv}
            </div>
        );


    }
    
    postMountFunction(){
        $(this.maindiv.current).on("mouseenter",this.mouseIn.bind(this));
        $(document).on("render-ports render-links",()=>{this.setState({})});
        if(this.state.initial_render)this.setState({initial_render:false,port_render:true});
        this.makeDroppable();
    }

    componentDidUpdate(prevProps){
        if(this.props.data.is_dropped==prevProps.data.is_dropped)this.updatePorts();
        else Constants.triggerHandlerEach($(".node"),"component-updated");
        if(this.state.port_render)this.setState({initial_render:false,port_render:false});
    }

    
    updatePorts(){
        $(this.maindiv.current).triggerHandler("component-updated");
    }
    
    toggleDrop(){
        this.props.dispatch(changeField(this.props.objectID,this.objectType,"is_dropped",!this.props.data.is_dropped));
    }

    makeDroppable(){
        var props = this.props;
        $(this.maindiv.current).droppable({
            tolerance:"pointer",
            droppable:".outcome-ghost",
            over:(e,ui)=>{
                var drop_item = $(e.target);
                var drag_item = ui.draggable;
                var drag_helper = ui.helper;
                var new_index = drop_item.prevAll().length;
                var new_parent_id = parseInt(drop_item.parent().attr("id")); 
                
                if(drag_item.hasClass("outcome")){
                    drag_helper.addClass("valid-drop");
                    drop_item.addClass("new-node-drop-over");
                    return;
                }else{
                    return;
                }
            },
            out:(e,ui)=>{
                var drag_item = ui.draggable;
                var drag_helper = ui.helper;
                var drop_item = $(e.target);
                if(drag_item.hasClass("new-node")){
                    drag_helper.removeClass("valid-drop");
                    drop_item.removeClass("new-node-drop-over");
                }
            },
            drop:(e,ui)=>{
                $(".new-node-drop-over").removeClass("new-node-drop-over");
                var drop_item = $(e.target);
                var drag_item = ui.draggable;
                if(drag_item.hasClass("outcome")){
                    addOutcomeToNode(this.props.objectID,drag_item[0].dataDraggable.outcome,
                        (response_data)=>{
                            let action = addOutcomeToNodeAction(response_data);
                            props.dispatch(action);
                        }
                    );
                }
            }
        });
    }

    mouseIn(evt){
        if(evt.which==1)return;
        $("circle[data-node-id='"+this.props.objectID+"'][data-port-type='source']").addClass("mouseover");
        d3.selectAll(".node-ports").raise();
        var mycomponent = this;
        
        $(document).on("mousemove",function(evt){
            if(!mycomponent||!mycomponent.maindiv||Constants.mouseOutsidePadding(evt,$(mycomponent.maindiv.current),20)){
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
export default connect(
    mapNodeStateToProps,
    null
)(NodeView)



//Basic component to represent a Node
class NodeOutcomeViewUnconnected extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="node";
        this.objectClass=".node";
        this.state={
            initial_render:true
        }
    }
    
    render(){
        let data = this.props.data;
        let titleText = data.title;
        if(data.represents_workflow)titleText = data.linked_workflow_title;
        let descriptionText = data.description;
        if(data.represents_workflow)descriptionText = data.linked_workflow_description;
        
        
        return (
            <div 
                
                class={
                    "node column-"+data.columnworkflow+((this.state.selected && " selected")||"")+((data.is_dropped && " dropped")||"")+" "+Constants.node_keys[data.node_type]
                } 
                id={data.id} 
                ref={this.maindiv} 
                onClick={(evt)=>this.props.selection_manager.changeSelection(evt,this)}
            >
                <div class = "node-top-row">
                    <div class = "node-title">
                        <TitleText text={titleText} defaultText="New Node"/>
                    </div>
                </div>
                {!read_only && <div class="mouseover-actions">
                    {this.addInsertSibling(data)}
                    {this.addDuplicateSelf(data)}
                    {this.addDeleteSelf(data)}
                </div>
                }
                {this.addEditable(data)}
            </div>
        );


    }

}
export const NodeOutcomeView = connect(
    mapNodeStateToProps,
    null
)(NodeOutcomeViewUnconnected)
