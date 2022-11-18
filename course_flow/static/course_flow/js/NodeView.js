import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON, NodeLinkSVG, AutoLinkView, NodePorts, NodeTitle, TitleText} from "./ComponentJSON.js";
import NodeLinkView from "./NodeLinkView.js";
import OutcomeNodeView from "./OutcomeNode.js";
import {getNodeByID} from "./FindState.js";
import * as Constants from "./Constants.js";
import {updateOutcomenodeDegree, updateValueInstant, toggleDrop} from "./PostFunctions.js"


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
        let data_override;
        if(data.represents_workflow) data_override = {...data,...data.linked_workflow_data};
        else data_override={...data};
        let renderer = this.props.renderer;
        let selection_manager=renderer.selection_manager;
        var nodePorts;
        var node_links;
        var auto_link;
        
        if(!this.state.initial_render)nodePorts = reactDom.createPortal(
                <NodePorts renderer={renderer} nodeID={this.props.objectID} node_div={this.maindiv} dispatch={this.props.dispatch}/>
            ,$(".workflow-canvas")[0]
        );
        if(renderer.ports_rendered&&!this.state.port_render){
            node_links = data.outgoing_links.map((link)=>
                <NodeLinkView key={link} objectID={link} node_div={this.maindiv} renderer={renderer}/>
            );
            if(data.has_autolink)auto_link = (
                <AutoLinkView nodeID={this.props.objectID} node_div={this.maindiv}/>
            );
        }
        let outcomenodes = data.outcomenode_unique_set.map((outcomenode)=>
            <OutcomeNodeView key={outcomenode} objectID={outcomenode} renderer={renderer}/>
        );
        let outcomeDiv;
        if(outcomenodes.length>0){
            outcomeDiv = (
                <div class="outcome-node-indicator">
                    <div class={"outcome-node-indicator-number column-"+data.column} style={{borderColor:Constants.getColumnColour(this.props.column)}}>{outcomenodes.length}</div>
                    <div class={"outcome-node-container column-"+data.column} style={{borderColor:Constants.getColumnColour(this.props.column)}}>{outcomenodes}</div>
                </div>
            );
        }
        let lefticon;
        let righticon;
        if(data.context_classification>0)lefticon=(
            <img title={
                renderer.context_choices.find(
                    (obj)=>obj.type==data.context_classification
                ).name
            } src={iconpath+Constants.context_keys[data.context_classification]+".svg"}/>
        )
        if(data.task_classification>0)righticon=(
            <img title={
                renderer.task_choices.find(
                    (obj)=>obj.type==data.task_classification
                ).name
            }src={iconpath+Constants.task_keys[data.task_classification]+".svg"}/>
        )
        let dropIcon;
        if(data.is_dropped)dropIcon = "droptriangleup";
        else dropIcon = "droptriangledown";
        let linkIcon;
        let linktext = gettext("Visit workflow");
        let clickfunc = this.doubleClick.bind(this);
        let link_class = "linked-workflow";
        if(data.linked_workflow_data){
            console.log("linked workflow");
            console.log(data.linked_workflow_data.url);
            if(data.linked_workflow_data.url=="noaccess" || data.linked_workflow_data.url=="nouser"){
                linktext=gettext("<Inaccessible>");
                clickfunc=null;
                link_class+=" link-noaccess";
            }
            else if(data.linked_workflow_data.deleted){
                linktext=gettext("<Deleted>")
                clickfunc=null;
                link_class+=" link-noaccess";
            }else{
                link_class+=" hover-shade"
            }
        }
        
        if(data.linked_workflow)linkIcon=(
            <div class={link_class} onClick={clickfunc}>
                <img src={iconpath+"wflink.svg"}/>
                <div>{linktext}</div>
            </div>
        );
        let dropText = "";
        if(data_override.description&&data_override.description.replace(/(<p\>|<\/p>|<br>|\n| |[^a-zA-Z0-9])/g,'')!='')dropText="...";
        let titleText = (
            <NodeTitle data={data}/>
        );
        
        let style = {left:Constants.columnwidth*this.props.column_order.indexOf(data.column)+"px",backgroundColor:Constants.getColumnColour(this.props.column)};
        if(data.lock){
            style.outline="2px solid "+data.lock.user_colour;
        }
        if(Constants.checkSetHidden(data,this.props.object_sets))style.display="none";
        let css_class="node column-"+data.column+" "+Constants.node_keys[data.node_type];
        if(data.is_dropped)css_class+=" dropped";
        if(data.lock)css_class+=" locked locked-"+data.lock.user_id;

        let mouseover_actions = [];
        if(!this.props.renderer.read_only){
            mouseover_actions.push(this.addInsertSibling(data));
            mouseover_actions.push(this.addDuplicateSelf(data));
            mouseover_actions.push(this.addDeleteSelf(data));
        }
        if(renderer.view_comments)mouseover_actions.push(this.addCommenting(data));

        return (
            <div 
                style={style} 
                class={css_class}
                id={data.id} 
                ref={this.maindiv} 
                onClick={(evt)=>selection_manager.changeSelection(evt,this)}
            >
                <div class = "node-top-row">
                    <div class = "node-icon">
                        {lefticon}
                    </div>
                    {titleText}
                    <div class = "node-icon">
                        {righticon}
                    </div>
                </div>
                {linkIcon}
                <div class = "node-details">
                    <TitleText text={data_override.description} defaultText={gettext("Click to edit")}/>
                </div>
                <div class = "node-drop-row hover-shade" onClick={this.toggleDrop.bind(this)}>
                    <div class = "node-drop-side node-drop-left">{dropText}</div>
                    <div class = "node-drop-middle"><img src={iconpath+dropIcon+".svg"}/></div>
                    <div class = "node-drop-side node-drop-right">
                        <div class="node-drop-time">{data_override.time_required && (data_override.time_required+" "+this.props.renderer.time_choices[data_override.time_units].name)}</div>
                    </div>
                </div> 
                <div class="mouseover-actions">
                    {mouseover_actions}
                </div>
                {this.addEditable(data_override)}
                {nodePorts}
                {node_links}
                {auto_link}
                {outcomeDiv}
            </div>
        );


    }
    
    //Checks to see if we should mark this as empty. We don't want to do this if it's the only node in the week.
    updateHidden(){
        if($(this.maindiv.current).css("display")=="none"){
            let week = $(this.maindiv.current).parent(".node-week").parent();
            if(week.children(".node-week:not(.empty)").length>1)$(this.maindiv.current).parent(".node-week").addClass("empty");
        }
        else $(this.maindiv.current).parent(".nodeweek").removeClass("empty");
    }
    
    postMountFunction(){
        $(this.maindiv.current).on("mouseenter",this.mouseIn.bind(this));
        $(document).on("render-ports render-links",()=>{this.setState({})});
        if(this.state.initial_render)this.setState({initial_render:false,port_render:true});
        this.makeDroppable();
        $(this.maindiv.current).on("dblclick",this.doubleClick.bind(this));
        this.updateHidden();
    }

    componentDidUpdate(prevProps, prevState){
        if(this.props.data.is_dropped==prevProps.data.is_dropped)this.updatePorts();
        else Constants.triggerHandlerEach($(".node"),"component-updated");
        if(this.state.port_render)this.setState({initial_render:false,port_render:false});
        this.updateHidden();
    }

    
    updatePorts(){
        $(this.maindiv.current).triggerHandler("component-updated");
    }

    doubleClick(evt){
        evt.stopPropagation();
        if(this.props.data.linked_workflow){
            window.open(this.props.data.linked_workflow_data.url);
        }
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
                    drop_item.addClass("outcome-drop-over");
                    return;
                }else{
                    return;
                }
            },
            out:(e,ui)=>{
                var drag_item = ui.draggable;
                var drag_helper = ui.helper;
                var drop_item = $(e.target);
                if(drag_item.hasClass("outcome")){
                    drag_helper.removeClass("valid-drop");
                    drop_item.removeClass("outcome-drop-over");
                }
            },
            drop:(e,ui)=>{
                $(".outcome-drop-over").removeClass("outcome-drop-over");
                var drop_item = $(e.target);
                var drag_item = ui.draggable;
                if(drag_item.hasClass("outcome")){
                    props.renderer.tiny_loader.startLoad();
                    updateOutcomenodeDegree(this.props.objectID,drag_item[0].dataDraggable.outcome,1,
                        (response_data)=>{
                            props.renderer.tiny_loader.endLoad();
                        }
                    );
                }
            }
        });
    }

    mouseIn(evt){
        if($(".workflow-canvas").hasClass("creating-node-link"))return;
        if(!this.props.renderer.read_only)$("circle[data-node-id='"+this.props.objectID+"'][data-port-type='source']").addClass("mouseover");
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
export default connect(
    mapNodeStateToProps,
    null
)(NodeView)


//Basic component to represent a node in the outcomes table
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
        let data_override;
        if(data.represents_workflow)data_override = {...data,...data.linked_workflow_data}
        else data_override = data;
        let selection_manager = this.props.renderer.selection_manager;
        
        let style = {backgroundColor:Constants.getColumnColour(this.props.column)}
        if(data.lock){
            style.outline="2px solid "+data.lock.user_colour;
        }
        let css_class="node column-"+data.column+" "+Constants.node_keys[data.node_type];
        if(data.is_dropped)css_class+=" dropped";
        if(data.lock)css_class+=" locked locked-"+data.lock.user_id;
        
        
        return (
            <div 
                
                class={css_class}
                style={style}
                id={data.id} 
                ref={this.maindiv} 
                onClick={(evt)=>selection_manager.changeSelection(evt,this)}
            >
                <div class = "node-top-row">
                    <NodeTitle data={data}/>
                </div>
                {this.addEditable(data_override,true)}
            </div>
        );


    }

}
export const NodeOutcomeView = connect(
    mapNodeStateToProps,
    null
)(NodeOutcomeViewUnconnected)

//Basic component to represent a Node
class NodeComparisonViewUnconnected extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="node";
        this.objectClass=".node";
    }
    
    render(){
        let data = this.props.data;
        let data_override;
        if(data.represents_workflow) data_override = {...data,...data.linked_workflow_data};
        else data_override={...data};
        let renderer = this.props.renderer;
        let selection_manager=renderer.selection_manager;
        
        let outcomenodes = data.outcomenode_unique_set.map((outcomenode)=>
            <OutcomeNodeView key={outcomenode} objectID={outcomenode} renderer={renderer}/>
        );
        let outcomeDiv;
        if(outcomenodes.length>0){
            outcomeDiv = (
                <div class="outcome-node-indicator">
                    <div class={"outcome-node-indicator-number column-"+data.column} style={{borderColor:Constants.getColumnColour(this.props.column)}}>{outcomenodes.length}</div>
                    <div class={"outcome-node-container column-"+data.column} style={{borderColor:Constants.getColumnColour(this.props.column)}}>{outcomenodes}</div>
                </div>
            );
        }
        let lefticon;
        let righticon;
        if(data.context_classification>0)lefticon=(
            <img title={
                renderer.context_choices.find(
                    (obj)=>obj.type==data.context_classification
                ).name
            } src={iconpath+Constants.context_keys[data.context_classification]+".svg"}/>
        )
        if(data.task_classification>0)righticon=(
            <img title={
                renderer.task_choices.find(
                    (obj)=>obj.type==data.task_classification
                ).name
            }src={iconpath+Constants.task_keys[data.task_classification]+".svg"}/>
        )
        let titleText = (
            <NodeTitle data={data}/>
        );
        

        let style = {backgroundColor:Constants.getColumnColour(this.props.column)};
        if(data.lock){
            style.outline="2px solid "+data.lock.user_colour;
        }
        if(Constants.checkSetHidden(data,this.props.object_sets))style.display="none";
        let css_class="node column-"+data.column+" "+Constants.node_keys[data.node_type];
        if(data.lock)css_class+=" locked locked-"+data.lock.user_id;

        let mouseover_actions = [];
        if(!this.props.renderer.read_only){
            mouseover_actions.push(this.addInsertSibling(data));
            mouseover_actions.push(this.addDuplicateSelf(data));
            mouseover_actions.push(this.addDeleteSelf(data));
        }
        if(renderer.view_comments)mouseover_actions.push(this.addCommenting(data));

        return (
            <div 
                style={style} 
                class={css_class}
                id={data.id} 
                ref={this.maindiv} 
                onClick={(evt)=>selection_manager.changeSelection(evt,this)}
            >
                <div class = "node-top-row">
                    <div class = "node-icon">
                        {lefticon}
                    </div>
                    {titleText}
                    <div class = "node-icon">
                        {righticon}
                    </div>
                </div>
                <div class = "node-details">
                    <TitleText text={data_override.description} defaultText="Click to edit"/>
                </div> 
                <div class="mouseover-actions">
                    {mouseover_actions}
                </div>
                {this.addEditable(data_override)}
                {outcomeDiv}
            </div>
        );


    }
}
export const NodeComparisonView = connect(
    mapNodeStateToProps,
    null
)(NodeComparisonViewUnconnected)
