import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON, NodeLinkSVG, AutoLinkView, NodePorts, TitleText} from "./ComponentJSON.js";
import NodeLinkView from "./NodeLinkView.js";
import {getNodeByID} from "./FindState.js";
import * as Constants from "./Constants.js";
import {changeField} from "./Reducers.js";


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
        console.log("selection manager for node");
        console.log(this.props.selection_manager);
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
                </div>}
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
