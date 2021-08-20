import * as Redux from "redux";
import * as React from "react";
import * as reactDom from "react-dom";
import * as Constants from "./Constants.js";
import {newNodeAction, deleteSelfAction, insertBelowAction, insertChildAction, setLinkedWorkflowAction, changeField, newNodeLinkAction, newStrategyAction, toggleStrategyAction} from "./Reducers.js";
import {dot as mathdot, subtract as mathsubtract, matrix as mathmatrix, add as mathadd, multiply as mathmultiply, norm as mathnorm, isNaN as mathisnan} from "mathjs";
import {newNode, newNodeLink, duplicateSelf, insertSibling, getLinkedWorkflowMenu, addStrategy, toggleStrategy, insertChild, getCommentsForObject, addComment, removeComment} from "./PostFunctions.js"


//Extends the react component to add a few features that are used in a large number of components
export class ComponentJSON extends React.Component{
    constructor(props){
        super(props);
        this.state={};
        this.maindiv = React.createRef();
    }
    
    componentDidMount(){
        this.postMountFunction();
        if(this.props.renderer&& this.props.renderer.initial_loading)this.props.renderer.container.triggerHandler("component-loaded",this.objectType);
    }
    
    postMountFunction(){};
    
    makeSortableNode(sortable_block,parent_id,draggable_type,draggable_selector,axis=false,grid=false,connectWith="",handle=false){
        if(read_only)return;
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
                
                var delta_x= Math.round((ui.helper.offset().left-$("#"+$(e.target).attr("id")+draggable_selector).children(handle).first().offset().left)/Constants.columnwidth);
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
                var drag_helper = ui.helper;
                var new_index = drop_item.prevAll().length;
                var new_parent_id = parseInt(drop_item.parent().attr("id")); 
                
                if(drag_item.hasClass("new-node")){
                    drag_helper.addClass("valid-drop");
                    drop_item.addClass("new-node-drop-over");
                   
                }else if(drag_item.hasClass("node-week")){
                    this.sortableMovedFunction(
                        parseInt(drag_item.attr("id")),new_index,draggable_type,new_parent_id,drag_item.attr("data-child-id")
                    );
                }else{
                    console.log(drag_item);
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
    
    makeSortable(sortable_block,parent_id,draggable_type,draggable_selector,axis=false,grid=false,connectWith=false,handle=false){
        if(read_only)return;
        var props = this.props;
        sortable_block.sortable({
            containment:".workflow-container",
            axis:axis,
            cursor:"move",
            grid:grid,
            cursorAt:{top:20},
            handle:handle,
            tolerance:"pointer",
            distance:10,
            connectWith:connectWith,
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
                    this.sortableMovedFunction(parseInt(ui.item.attr("id")),placeholder_index,draggable_type,new_parent_id,ui.item.attr("data-child-id"));
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
    addDeleteSelf(data,alt_icon){
        let icon=alt_icon || "rubbish.svg";
        return (
            <ActionButton button_icon={icon} button_class="delete-self-button" titletext="Delete" handleClick={this.deleteSelf.bind(this,data)}/>
        );
    }
    
    deleteSelf(data){
        //Temporary confirmation; add better confirmation dialogue later
        if(this.props.renderer)this.props.renderer.selection_manager.deleted(this);
        if((this.objectType=="week"||this.objectType=="column")&&this.props.sibling_count<2){
            alert("You cannot delete the last "+this.objectType);
            return;
        }
        let extra_data = this.props.column_order;
        if(Constants.object_dictionary[this.objectType]=="outcome")extra_data=this.props.outcomenodes;
        if(window.confirm("Are you sure you want to delete this "+Constants.object_dictionary[this.objectType]+"?")){
            this.props.dispatch(deleteSelfAction(data.id,this.props.throughParentID,this.objectType,extra_data));
        }
    }
    
    //Adds a button that deltes the item (with a confirmation). The callback function is called after the object is removed from the DOM
    addDuplicateSelf(data){
        return (
            <ActionButton button_icon="duplicate.svg" button_class="duplicate-self-button" titletext="Duplicate" handleClick={this.duplicateSelf.bind(this,data)}/>
        );
    }
    
    duplicateSelf(data){
        var props = this.props;
        var type = this.objectType;
        props.renderer.tiny_loader.startLoad();
        duplicateSelf(
            data.id,
            Constants.object_dictionary[type],
            props.parentID,
            Constants.parent_dictionary[type],
            Constants.through_parent_dictionary[type],
            (response_data)=>{
                let action = insertBelowAction(response_data,type);
                props.dispatch(action);
                props.renderer.tiny_loader.endLoad();
            }
        );
    }
    
    //Adds a button that inserts a sibling below the item. 
    addInsertSibling(data){
        return(
            <ActionButton button_icon="add_new.svg" button_class="insert-sibling-button" titletext="Insert Below" handleClick={this.insertSibling.bind(this,data)}/>
        );
    }
    
    insertSibling(data){
        var props = this.props;
        var type = this.objectType;
        props.renderer.tiny_loader.startLoad();
        insertSibling(
            data.id,
            Constants.object_dictionary[type],
            props.parentID,
            Constants.parent_dictionary[type],
            Constants.through_parent_dictionary[type],
            (response_data)=>{
                let action = insertBelowAction(response_data,type);
                props.dispatch(action);
                props.renderer.tiny_loader.endLoad();
            }
        );
    }
    
    
    //Adds a button that inserts a child to them item
    addInsertChild(data){
        return(
            <ActionButton button_icon="create_new_child.svg" button_class="insert-child-button" titletext="Insert Child" handleClick={this.insertChild.bind(this,data)}/>
        );
    }
    
    insertChild(data){
        var props = this.props;
        var type = this.objectType;
        props.renderer.tiny_loader.startLoad();
        insertChild(data.id,Constants.object_dictionary[type],
            (response_data)=>{
                let action = insertChildAction(response_data,Constants.object_dictionary[type]);
                props.dispatch(action);
                props.renderer.tiny_loader.endLoad();
            }
        );
    }

    //Adds a button that opens/closes the comments dialogue
    addCommenting(data){
        let commentbox;
        return(
            [
                <ActionButton button_icon="comment_new.svg" button_class="comment-button" titletext="Comments" handleClick={this.commentClick.bind(this)}/>,
                <CommentBox show={this.state.show_comments} comments={this.state.comment_data} parent={this}/>
            ]
        );
    }
    
    commentClick(evt){
        evt.stopPropagation();
        if(!this.state.show_comments){
            this.reloadComments();
        }else(this.setState({show_comments:false}));
    }

    reloadComments(){
        let props = this.props;
        let data = props.data;
        props.renderer.tiny_loader.startLoad();
        getCommentsForObject(data.id,Constants.object_dictionary[this.objectType],
            (response_data)=>{
                console.log("Got some comments");
                console.log(response_data);
                this.setState({show_comments:true,comment_data:response_data.data_package});
                props.renderer.tiny_loader.endLoad();
            }
        );
    }
    
    //Makes the item selectable
    addEditable(data,no_delete=false){
        if(read_only)return null;
        if(this.state.selected){
            var type=Constants.object_dictionary[this.objectType];
            let title_length="50";
            if(type=="outcome")title_length="500";
            var props = this.props;
            return reactDom.createPortal(
                <div class="right-panel-inner" onClick={(evt)=>evt.stopPropagation()}>
                    <h3>{"Edit "+type+":"}</h3>
                    {type=="outcome" && data.depth==0 &&
                        <div>
                            <h4>Code (Optional):</h4>
                            <input autocomplete="off" id="code-editor" type="text" value={data.code} maxlength="50" onChange={this.inputChanged.bind(this,"code")}/>
                        </div>
                    }
                    {["node","week","column","workflow","outcome"].indexOf(type)>=0 && !data.represents_workflow &&
                        <div>
                            <h4>Title:</h4>
                            <input autocomplete="off" id="title-editor" type="text" value={data.title} maxlength={title_length} onChange={this.inputChanged.bind(this,"title")}/>
                        </div>
                    }
                    {["node","workflow","outcome"].indexOf(type)>=0 && !data.represents_workflow &&
                        <div>
                            <h4>Description:</h4>
                            <QuillDiv text={data.description} maxlength="500" textChangeFunction={this.valueChanged.bind(this,"description")} placholder="Insert description here"/>
                        </div>
                    }
                    {type=="node" && data.node_type<2 &&
                        <div>
                            <h4>Context:</h4>
                            <select  id="context-editor" value={data.context_classification} onChange={this.inputChanged.bind(this,"context_classification")}>
                                {this.props.renderer.context_choices.filter(choice=>(Math.floor(choice.type/100)==data.node_type||choice.type==0)).map((choice)=>
                                    <option value={choice.type}>{choice.name}</option>
                                )}
                            </select>
                        </div>
                    }
                    {type=="node" && data.node_type<2 &&
                        <div>
                            <h4>Task:</h4>
                            <select id="task-editor" value={data.task_classification} onChange={this.inputChanged.bind(this,"task_classification")}>
                                {this.props.renderer.task_choices.filter(choice=>(Math.floor(choice.type/100)==data.node_type||choice.type==0)).map((choice)=>
                                    <option value={choice.type}>{choice.name}</option>
                                )}
                            </select>
                        </div>
                    }
                    {type=="node" &&
                        <div>
                            <h4>Time:</h4>
                            <div>
                                <input autocomplete="off" id="time-editor" class="half-width" type="text" value={data.time_required} maxlength="30" onChange={this.inputChanged.bind(this,"time_required")}/>
                                <select id="time-units-editor" class="half-width" value={data.time_units} onChange={this.inputChanged.bind(this,"time_units")}>
                                    {this.props.renderer.time_choices.map((choice)=>
                                        <option value={choice.type}>{choice.name}</option>
                                    )}
                                </select>
                            </div>
                        </div>
                    }
                    {type=="node" && data.node_type!=0 &&
                        <div>
                            <h4>Linked Workflow:</h4>
                            <div>{data.linked_workflow_title}</div>
                            <button  id="linked-workflow-editor" onClick={()=>{getLinkedWorkflowMenu(data,(response_data)=>{
                                let action = setLinkedWorkflowAction(response_data);
                                props.dispatch(action);
                            })}}>
                                Change
                            </button>
                            <input type="checkbox" name="respresents_workflow" checked={data.represents_workflow} onChange={this.checkboxChanged.bind(this,"represents_workflow")}/>
                            <label for="repesents_workflow">Display data</label>
                        </div>
                    }
                    {type=="node" && data.node_type!=2 &&
                        <div>
                            <h4>Other:</h4>
                            <input type="checkbox" name="has_autolink" checked={data.has_autolink} onChange={this.checkboxChanged.bind(this,"has_autolink")}/>
                            <label for="has_autolink">Draw arrow to next node</label>
                        </div>
                    }
                    {type=="workflow" &&
                        <div>
                            <h4>Settings:</h4>
                            <label for="outcomes_type">Outcomes Style</label>
                            <select name="outcomes_type" value={data.outcomes_type} onChange={this.inputChanged.bind(this,"outcomes_type")}>
                                {this.props.renderer.outcome_type_choices.map((choice)=>
                                    <option value={choice.type}>{choice.name}</option>
                                )}
                            </select>
                            {data.is_strategy && 
                                [
                                <input type="checkbox" name="is_published" checked={data.published} onChange={this.checkboxChanged.bind(this,"published")}/>,
                                <label for="is_published">Published</label>
                                ]
                            }
                        </div>
                    }
                    {type=="week" && data.week_type <2 &&
                        <div>
                            <h4>Strategy:</h4>
                            <select value={data.strategy_classification} onChange={this.inputChanged.bind(this,"strategy_classification")}>
                                {this.props.renderer.strategy_classification_choices.map((choice)=>
                                    <option value={choice.type}>{choice.name}</option>
                                )}
                            </select>
                            <button id="toggle-strategy-editor" onClick = {()=>{
                                let loader = new Constants.Loader('body');
                                toggleStrategy(data.id,data.is_strategy,
                                (response_data)=>{
                                    let action = toggleStrategyAction(response_data);
                                    props.dispatch(action);
                                    loader.endLoad();
                                })
                            }}>
                                {data.is_strategy &&
                                    "Remove Strategy Status"
                                }
                                {!data.is_strategy &&
                                    "Save as Template "
                                }
                            </button>
                        </div>
                    }

                    {(!no_delete && type!="workflow" && (type !="outcome" || data.depth>0)) && 
                        [<h4>Delete:</h4>,
                        this.addDeleteSelf(data)]
                    }
                </div>
            ,$("#edit-menu")[0])
        }
    }
    
    inputChanged(field,evt){
        let value=evt.target.value;
        if(!value)value="";
        this.props.dispatch(changeField(this.props.data.id,Constants.object_dictionary[this.objectType],field,evt.target.value));
    }

    checkboxChanged(field,evt){
         this.props.dispatch(changeField(this.props.data.id,Constants.object_dictionary[this.objectType],field,evt.target.checked));
    }

    valueChanged(field,new_value){
        this.props.dispatch(changeField(this.props.data.id,Constants.object_dictionary[this.objectType],field,new_value));
    }
}



export class NodeLinkSVG extends React.Component{
    render(){
        
        try{
            const source_transform=Constants.getSVGTranslation(this.props.source_port_handle.select(function(){
                return this.parentNode}).attr("transform"));
            const target_transform=Constants.getSVGTranslation(this.props.target_port_handle.select(function(){
                return this.parentNode}).attr("transform"));
            const source_point=[parseInt(this.props.source_port_handle.attr("cx"))+parseInt(source_transform[0]),parseInt(this.props.source_port_handle.attr("cy"))+parseInt(source_transform[1])];
            const target_point=[parseInt(this.props.target_port_handle.attr("cx"))+parseInt(target_transform.[0]),parseInt(this.props.target_port_handle.attr("cy"))+parseInt(target_transform[1])];

            var path_array = this.getPathArray(source_point,this.props.source_port,target_point,this.props.target_port);
            var path=(this.getPath(path_array));

            return (
                <g fill="none" stroke="black">
                    <path opacity="0" stroke-width="10px" d={path} onClick={this.props.clickFunction} class={"nodelink"+((this.props.selected && " selected")||"")}/>
                    <path opacity="0.4" stroke-width="2px" d={path} marker-end="url(#arrow)"/>
                </g>
            );
        }catch(err){return null;}
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

export class AutoLinkView extends React.Component{
    constructor(props){
        super(props);
        this.eventNameSpace="autolink"+props.nodeID;
        this.rerenderEvents = "ports-rendered."+this.eventNameSpace;
    }
    
    render(){
        if(!this.source_node||this.source_node.length==0){
            this.source_node = $(this.props.node_div.current);
            this.source_port_handle = d3.select(
                "g.port-"+this.props.nodeID+" circle[data-port-type='source'][data-port='s']"
            );
            this.source_node.on(this.rerenderEvents,this.rerender.bind(this));
        }
        if(this.target_node&&this.target_node.parent().parent().length==0)this.target_node=null;
        this.findAutoTarget();
        if(!this.target_node)return null;
        var source_dims = {width:this.source_node.outerWidth(),height:this.source_node.outerHeight()};
        var target_dims = {width:this.target_node.outerWidth(),height:this.target_node.outerHeight()};
        return(
            <div>
                {reactDom.createPortal(
                    <NodeLinkSVG source_port_handle={this.source_port_handle} source_port="2" target_port_handle={this.target_port_handle} target_port="0" source_dimensions={source_dims} target_dimensions={target_dims}/>
                    ,$(".workflow-canvas")[0])}
            </div>
        );
    }

    findAutoTarget(){
        var ns = this.source_node.closest(".node-week");
        var next_ns = ns.nextAll(".node-week:not(.ui-sortable-placeholder)").first();
        var target;
        if(next_ns.length>0){
            target = next_ns.find(".node").attr("id");
        }else{
            var sw = ns.closest(".week-workflow");
            var next_sw = sw.next();
            while(next_sw.length>0){
                target = next_sw.find(".node-week:not(ui-sortable-placeholder) .node").attr("id");
                if(target)break;
                next_sw = next_sw.next();
            }
        }
        this.setTarget(target);
    }

    rerender(evt){
        this.setState({});
    }

    setTarget(target){
        if(target){
            if(this.target_node&&target==this.target_node.attr("id")){
                if(!this.target_port_handle||this.target_port_handle.empty()){
                    this.target_port_handle = d3.select(
                        "g.port-"+target+" circle[data-port-type='target'][data-port='n']"
                    );
                }
                return;
            }
            if(this.target_node)this.target_node.off(this.rerenderEvents);
            this.target_node = $(".week #"+target+".node");
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

    componentWillUnmount(){
        if(this.target_node&&this.target_node.length>0){
            this.source_node.off(this.rerenderEvents);
            this.target_node.off(this.rerenderEvents);
        }
    }
}

//The ports used to connect links for the nodes
export class NodePorts extends React.Component{
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
        for(var port_type in Constants.node_ports)for(var port in Constants.node_ports[port_type]){
            ports.push(
                <circle data-port-type={port_type} data-port={port} data-node-id={this.props.nodeID} r="6" key={port_type+port} 
                cx={Constants.node_ports[port_type][port][0]*node_dimensions.width} 
                cy={Constants.node_ports[port_type][port][1]*node_dimensions.height}/>
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
        var thisComponent=this;
        if(!read_only)d3.selectAll(
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
        //$(this.props.node_div.current).triggerHandler("ports-rendered");
        this.props.renderer.container.triggerHandler("ports-rendered");
    }
    
    updatePorts(){
        if(!this.props.node_div.current)return;
        var node = $(this.props.node_div.current);
        var node_offset = Constants.getCanvasOffset(node);
        var node_dimensions={width:node.outerWidth(),height:node.outerHeight()};
        //if(node.closest(".week-workflow").hasClass("dragging")||this.state.node_offset==node_offset&&this.state.node_dimensions==node_dimensions)return;
        this.setState({node_offset:node_offset,node_dimensions:node_dimensions});
    }
    
    componentDidUpdate(){
        $(this.props.node_div.current).triggerHandler("ports-rendered");
    }
    
    nodeLinkAdded(target,source_port,target_port){
        let props=this.props;
        if(target==this.props.nodeID)return;
        newNodeLink(props.nodeID,target,Constants.port_keys.indexOf(source_port),Constants.port_keys.indexOf(target_port),(response_data)=>{
            let action = newNodeLinkAction(response_data);
            props.dispatch(action);
        });
    }
}


//A commenting box
export class CommentBox extends React.Component{
    constructor(props){
        super(props);
        this.input = React.createRef();
        this.state={};
    }
    
    render(){
        console.log(this.state);
        let has_comments=false;
        if(this.state.has_rendered){
            if(this.props.comments){
                has_comments = this.props.comments.length>0;
            }else{
                console.log(this.props.parent.props)
                has_comments = this.props.parent.props.data.comments.length>0;
            }
        }
        let comment_indicator=null;
        if(has_comments)comment_indicator=reactDom.createPortal(
            <div class="comment-indicator hover-shade" onClick={this.props.parent.commentClick.bind(this.props.parent)}>
                <img src={iconpath+"comment_new.svg"}/>
            </div>,
            this.props.parent.maindiv.current
        );
        
        
        if(!this.props.show){
            return comment_indicator;
        }
        
        let comments;
        if(this.props.comments)comments = this.props.comments.map(comment=>
            <div class="comment">
                <div class="comment-text">
                    {comment.text}
                </div>
                <div class="comment-by">
                    { "-"+comment.user+" on "+comment.created_on}
                </div>
                {!read_only && <div class="mouseover-actions">
                    <div class="window-close-button" onClick={this.removeComment.bind(this,comment.id)}>
                        <img src={iconpath+"close.svg"}/>
                    </div>
                </div>
                }
            </div>               
        )
        
        return reactDom.createPortal(
            [
            <div class="comment-box" onClick={(evt)=>evt.stopPropagation()}>
                <div class="window-close-button" onClick = {this.props.parent.commentClick.bind(this.props.parent)}>
                    <img src = {iconpath+"close.svg"}/>
                </div>
                <div class="comment-block">
                    {comments}
                </div>
                <textarea ref={this.input}/>
                <button class="menu-create" onClick={this.appendComment.bind(this)}>Submit</button>
            </div>,
            comment_indicator
            ],
            this.props.parent.maindiv.current
        )
    }
    
    removeComment(id){
        let parent = this.props.parent;
        let props = parent.props;
        if(window.confirm("Are you sure you want to permanently clear this comment?")){
            removeComment(props.objectID,Constants.object_dictionary[parent.objectType],id,
                parent.reloadComments.bind(parent)
            );
        }
    }
    
    appendComment(){
        let text=this.input.current.value;
        if(!text)return;
        let parent = this.props.parent;
        let props = parent.props;
        console.log(props);
        this.input.current.value=null;
        addComment(props.objectID,Constants.object_dictionary[parent.objectType]   ,text,parent.reloadComments.bind(parent));
    }

    componentDidMount(){
        this.setState({has_rendered:true})
    }
    
}


//Text that can be passed a default value
export class TitleText extends React.Component{
    
    render(){
        var text = this.props.text;
        if((this.props.text==null || this.props.text=="") && this.props.defaultText!=null){
            text=this.props.defaultText;
        }
        return (
            <div class="title-text" dangerouslySetInnerHTML={{ __html: text }}></div>
        )
    }

}

//Title for an outcome
export class OutcomeTitle extends React.Component{
    render(){
        let data = this.props.data
        let text = data.title;
        if(data.title==null || data.title==""){
            text="Untitled outcome";
        }
        
        let hovertext = this.props.rank.map((rank,i)=>
            rank+". "+this.props.titles[i]
        ).join(" -> ");
        
        return (
            <div title={hovertext} class="title-text">
                <span>{this.props.rank.join(".")+" - "}</span>
                <span dangerouslySetInnerHTML={{ __html: text }}></span>
            </div>
        )
    }

}

//Quill div
export class QuillDiv extends React.Component{
    constructor(props){
        super(props);
        this.maindiv = React.createRef();
    }
    
    render(){
        
        return(
            <div ref={this.maindiv} class="quill-div">
                
            </div>
        );
    }
    
    componentDidMount(){
        let quill_container = this.maindiv.current;
        let toolbarOptions = [['bold','italic','underline'],[{'script':'sub'},{'script':'super'}],[{'list':'bullet'},{'list':'ordered'}],['link']/*,['formula']*/];
        let quill = new Quill(quill_container,{
            theme:'snow',
            modules:{
                toolbar:toolbarOptions
            },
            placeholder:this.props.placeholder
        });
        if(this.props.text)quill.clipboard.dangerouslyPasteHTML(this.props.text);
        quill.on('text-change',()=>{
            this.props.textChangeFunction(quill_container.childNodes[0].innerHTML.replace(/\<p\>\<br\>\<\/p\>\<ul\>/g,"\<ul\>"));
        });
        let toolbar = quill.getModule('toolbar');
        toolbar.defaultLinkFunction=toolbar.handlers['link'];
        toolbar.addHandler("link",function customLinkFunction(value){
            var select = quill.getSelection();
            if(value&&select['length']==0&&!read_only){
                quill.insertText(select['index'],'link');
                quill.setSelection(select['index'],4);
            }
            this.defaultLinkFunction(value);
        });
    }
    
    
}


//A button which causes an item to delete itself or insert a new item below itself.
export class ActionButton extends React.Component{
    constructor(props){
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }
    
    render(){
        return (
            <div class={this.props.button_class+" action-button"} title={this.props.titletext} onClick={this.handleClick}>
                <img src={iconpath+this.props.button_icon}/>
            </div>
        )
    }
    
    handleClick(evt){
        this.props.handleClick(evt);
        evt.stopPropagation();
    }
}

//Creates paths between two ports
export class PathGenerator{
    constructor(source_point,source_port,target_point,target_port,source_dims,target_dims){
        this.point_arrays={source:[source_point],target:[target_point]};
        this.last_point={source:source_point,target:target_point};
        this.direction = {source:Constants.port_direction[source_port],target:Constants.port_direction[target_port]};
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
        this.addDelta(mathmultiply(Constants.port_padding,this.direction[port]),port);
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



