import * as Redux from "redux";
import * as React from "react";
import * as reactDom from "react-dom";
import * as Constants from "./Constants";
import {dot as mathdot, subtract as mathsubtract, matrix as mathmatrix, add as mathadd, multiply as mathmultiply, norm as mathnorm, isNaN as mathisnan} from "mathjs";
import {reloadCommentsAction} from "./Reducers";
import {getUsersForObject, restoreSelf, toggleDrop, newNode, newNodeLink, duplicateSelf, deleteSelf, insertSibling, getLinkedWorkflowMenu, addStrategy, toggleStrategy, insertChild, getCommentsForObject, addComment, removeComment, removeAllComments, updateObjectSet} from "./PostFunctions";


//Extends the react component to add a few features that are used in a large number of components
export class Component extends React.Component{
    constructor(props){
        super(props);
        this.state={};
        this.maindiv = React.createRef();
    }
    
    toggleDrop(evt){
        evt.stopPropagation();
        toggleDrop(this.props.objectID,Constants.object_dictionary[this.objectType],!this.props.data.is_dropped,this.props.dispatch,this.props.data.depth);
    }
}

//Extends the react component to add a few features that are used in a large number of components
export class EditableComponent extends Component{

    //Makes the item selectable
    addEditable(data,no_delete=false){
        let read_only = this.props.renderer.read_only;
        if(this.state.selected){
            var type=Constants.object_dictionary[this.objectType];
            let title_length="100";
            if(type=="outcome")title_length="500";
            var props = this.props;
            let override = false;
            let title=Constants.unescapeCharacters(data.title || "");
            let description=data.description || "";
            if(data.represents_workflow)override=true;

            let sets;
            if(this.props.object_sets && ["node","outcome"].indexOf(type)>=0){
                let term_type=data.type;
                if(type=="node")term_type=Constants.node_type_keys[data.node_type];
                
                let allowed_sets = this.props.object_sets.filter(set=>set.term==term_type);
                if(allowed_sets.length>=0){
                    let disable_sets=false;
                    if(data.depth || read_only)disable_sets=true;
                    let set_options = allowed_sets.map(set=>
                        <div>
                            <input disabled={disable_sets} type="checkbox" name={set.id} checked={data.sets.indexOf(set.id)>=0} onChange={this.setChanged.bind(this,set.id)}/>
                            <label for={set.id}>{set.title}</label>   
                        </div>
                    );
                    sets = (
                        [<h4>{gettext("Sets")}</h4>,
                        set_options]
                    );
                }
            }
            
            return reactDom.createPortal(
                <div class="right-panel-inner" onClick={(evt)=>evt.stopPropagation()}>
                    <h3>{gettext("Edit ")+Constants.get_verbose(data,this.objectType)}</h3>
                    {["node","week","column","workflow","outcome","nodelink"].indexOf(type)>=0 &&
                        <div>
                            <h4>{gettext("Title")}</h4>
                            <textarea resize="none" disabled={override || read_only} autocomplete="off" id="title-editor" type="text" value={title} maxlength={title_length} onChange={this.inputChanged.bind(this,"title")}/>
                              <div class="character-length">
                                {title.length}/{title_length} {gettext("characters")}
                              </div>
                        </div>
                    }
                    {["node","workflow","outcome"].indexOf(type)>=0 &&
                        <div>
                            <h4>{gettext("Description")}</h4>
                            <QuillDiv  disabled={override || read_only} text={description} maxlength="500" textChangeFunction={this.valueChanged.bind(this,"description")} placholder="Insert description here"/>
                        </div>
                    }
                    {type=="column" &&
                        <div>
                            <h4>{gettext("Custom Icon")}</h4>
                            <p>Browse options <a href="https://fonts.google.com/icons?icon.style=Rounded&icon.platform=android&icon.category=Activities">here</a>.</p>
                            <input disabled={override || read_only} autocomplete="off" id="column-icon-editor" type="text" value={data.icon} maxlength={50} onChange={this.inputChanged.bind(this,"icon")}/>
                        </div>
                    }
                    {((type=="outcome" && data.depth==0)||(type=="workflow" && data.type=="course")) &&
                        <div>
                            <h4>{gettext("Code (Optional)")}</h4>
                            <input autocomplete="off" disabled={read_only} id="code-editor" type="text" value={data.code} maxlength="50" onChange={this.inputChanged.bind(this,"code")}/>
                        </div>
                    }
                    {type=="node" && data.node_type<2 &&
                        <div>
                            <h4>{gettext("Context")}</h4>
                            <select  id="context-editor" disabled={read_only} value={data.context_classification} onChange={this.inputChanged.bind(this,"context_classification")}>
                                {this.props.renderer.context_choices.filter(choice=>(Math.floor(choice.type/100)==data.node_type||choice.type==0)).map((choice)=>
                                    <option value={choice.type}>{choice.name}</option>
                                )}
                            </select>
                        </div>
                    }
                    {type=="node" && data.node_type<2 &&
                        <div>
                            <h4>{gettext("Task")}</h4>
                            <select id="task-editor" disabled={read_only} value={data.task_classification} onChange={this.inputChanged.bind(this,"task_classification")}>
                                {this.props.renderer.task_choices.filter(choice=>(Math.floor(choice.type/100)==data.node_type||choice.type==0)).map((choice)=>
                                    <option value={choice.type}>{choice.name}</option>
                                )}
                            </select>
                        </div>
                    }
                    {(type=="node" || type=="workflow") &&
                        <div>
                            <h4>{gettext("Time")}</h4>
                            <div>
                                <input disabled={override || read_only} autocomplete="off" id="time-editor" class="half-width" type="text" value={data.time_required} maxlength="30" onChange={this.inputChanged.bind(this,"time_required")}/>
                                <select disabled={override || read_only} id="time-units-editor" class="half-width" value={data.time_units} onChange={this.inputChanged.bind(this,"time_units")}>
                                    {this.props.renderer.time_choices.map((choice)=>
                                        <option value={choice.type}>{choice.name}</option>
                                    )}
                                </select>
                            </div>
                        </div>
                    }
                    {(type=="column") &&
                        <div>
                            <h4>{gettext("Colour")}</h4>
                            <div>
                                <input disabled={read_only} autocomplete="off" id="colour-editor" class="half-width" type="color" value={"#"+data.colour?.toString(16)} maxlength="30" onChange={this.inputChanged.bind(this,"colour")}/>
                            </div>
                        </div>
                    }
                    {((type=="workflow" && data.type=="course")||(type=="node" && data.node_type==2)) &&
                        <div>
                            <h4>{gettext("Ponderation")}</h4>
                            <input disabled={override || read_only} autocomplete="off" class="half-width" id="ponderation-theory" type="number" value={data.ponderation_theory} onChange={this.inputChanged.bind(this,"ponderation_theory")}/>
                            <div class="half-width">{gettext("hrs. Theory")}</div>
                            <input disabled={override || read_only} autocomplete="off" class="half-width" id="ponderation-practical" type="number" value={data.ponderation_practical} onChange={this.inputChanged.bind(this,"ponderation_practical")}/>
                            <div class="half-width">{gettext("hrs. Practical")}</div>
                            <input disabled={override || read_only} class="half-width" autocomplete="off" class="half-width" id="ponderation-individual" type="number" value={data.ponderation_individual} onChange={this.inputChanged.bind(this,"ponderation_individual")}/>
                            <div class="half-width">{gettext("hrs. Individual")}</div>
                            <input disabled={override || read_only} class="half-width" autocomplete="off" class="half-width" id="time-general-hours" type="number" value={data.time_general_hours} onChange={this.inputChanged.bind(this,"time_general_hours")}/>
                            <div class="half-width">{gettext("hrs. General Education")}</div>
                            <input disabled={override || read_only} class="half-width" autocomplete="off" class="half-width" id="time-specific-hours" type="number" value={data.time_specific_hours} onChange={this.inputChanged.bind(this,"time_specific_hours")}/>
                            <div class="half-width">{gettext("hrs. Specific Education")}</div>
                        </div>
                    }
                    {type=="node" && data.node_type!=0 &&
                        <div>
                            <h4>{gettext("Linked Workflow")}</h4>
                            <div>{data.linked_workflow && data.linked_workflow_data.title}</div>
                            <button  class="primary-button" disabled={read_only} id="linked-workflow-editor" onClick={()=>{
                                props.renderer.tiny_loader.startLoad();
                                getLinkedWorkflowMenu(
                                    data,
                                    (response_data)=>{
                                        console.log("linked a workflow");
                                    },
                                    ()=>{
                                        props.renderer.tiny_loader.endLoad();
                                    }
                                );
                            }}>
                                {gettext("Change")}
                            </button>
                            <input disabled={read_only} type="checkbox" name="respresents_workflow" checked={data.represents_workflow} onChange={this.checkboxChanged.bind(this,"represents_workflow")}/>
                            <label for="repesents_workflow">{gettext("Display linked workflow data")}</label>
                        </div>
                    }
                    {type=="node" && data.node_type!=2 &&
                        <div>
                            <h4>{gettext("Other")}</h4>
                            <input disabled={read_only} type="checkbox" name="has_autolink" checked={data.has_autolink} onChange={this.checkboxChanged.bind(this,"has_autolink")}/>
                            <label for="has_autolink">{gettext("Draw arrow to next node")}</label>
                        </div>
                    }
                    {type=="nodelink" &&
                        <div>
                            <h4>{gettext("Style")}</h4>
                            <div>
                                <input disabled={read_only} type="checkbox" name="dashed" checked={data.dashed} onChange={this.checkboxChanged.bind(this,"dashed")}/>
                                <label for="dashed">{gettext("Dashed Line")}</label>
                            </div>
                            <div>
                                <label for="text-position-range">{gettext("Text Position")}</label>
                                <div class="slidecontainer">
                                      <input disabled={read_only} type="range" min="1" max="100" value={data.text_position} class="range-slider" id="text-position-range" onChange={this.inputChanged.bind(this,"text_position")}/>               
                                </div>
                            </div>
                        </div>
                    }
                    {type=="workflow" &&
                        <div>
                            <h4>{gettext("Settings")}</h4>
                            <div>
                                <label for="outcomes_type">{gettext("Outcomes Style")}</label>
                                <select disabled={read_only} name="outcomes_type" value={data.outcomes_type} onChange={this.inputChanged.bind(this,"outcomes_type")}>
                                    {this.props.renderer.outcome_type_choices.map((choice)=>
                                        <option value={choice.type}>{choice.name}</option>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label for="condensed">{gettext("Condensed View")}</label>
                                <input disabled={read_only} type="checkbox" name="condensed" checked={data.condensed} onChange={this.checkboxChanged.bind(this,"condensed")}/>                            
                            </div>
                            {data.is_strategy && 
                            <div>
                                <label for="is_published">{gettext("Published")}</label>
                                <input disabled={read_only} type="checkbox" name="is_published" checked={data.published} onChange={this.checkboxChanged.bind(this,"published")}/>
                            </div>
                            }
                        </div>
                    }
                    {type=="week" && data.week_type <2 &&
                        <div>
                            <h4>{gettext("Strategy")}</h4>
                            <select disabled={read_only} value={data.strategy_classification} onChange={this.inputChanged.bind(this,"strategy_classification")}>
                                {this.props.renderer.strategy_classification_choices.map((choice)=>
                                    <option value={choice.type}>{choice.name}</option>
                                )}
                            </select>
                            <button disabled={read_only} id="toggle-strategy-editor" onClick = {()=>{
                                let loader = new Constants.Loader('body');
                                toggleStrategy(data.id,data.is_strategy,
                                (response_data)=>{
                                    loader.endLoad();
                                })
                            }}>
                                {data.is_strategy &&
                                    gettext("Remove Strategy Status")
                                }
                                {!data.is_strategy &&
                                    gettext("Save as Template")
                                }
                            </button>
                        </div>
                    }
                    {sets}
                    {this.getDeleteForSidebar(read_only,no_delete,type,data)}
                </div>
            ,$("#edit-menu")[0])
        }
    }

    getDeleteForSidebar(read_only,no_delete,type,data){
        if(!read_only && !no_delete && (type !="outcome" || data.depth>0)){
            if(type == "workflow") return [
                null
            ]
            else return [
                <h4>{gettext("Delete")}</h4>,
                this.addDeleteSelf(data)
            ]
        }

    }
    
    inputChanged(field,evt){
        let value=evt.target.value;
        if(evt.target.type=="number")value=parseInt(value)||0;
        else if(!value)value="";
        if(field=="colour")value=parseInt(value.replace("#",""),16);
        if(evt.target.type=="number"&&value=="")value=0;
        this.props.renderer.change_field(this.props.data.id,Constants.object_dictionary[this.objectType],field,value);
    }

    setChanged(set_id,evt){
        this.props.renderer.tiny_loader.startLoad();
        updateObjectSet(
            this.props.data.id,
            Constants.object_dictionary[this.objectType],
            set_id,
            evt.target.checked,
            ()=>{
                this.props.renderer.tiny_loader.endLoad();
            }
        )
    }

    checkboxChanged(field,evt){
        let do_change=true;
        if(do_change)this.props.renderer.change_field(this.props.data.id,Constants.object_dictionary[this.objectType],field,evt.target.checked);
    }

    valueChanged(field,new_value){
        this.props.renderer.change_field(this.props.data.id,Constants.object_dictionary[this.objectType],field,new_value);
    }

    get_border_style(){
        let data = this.props.data;
        if(!data)return;
        let style={};
        if(data.lock){
            style.border="2px solid "+data.lock.user_colour;
        }
        return style;
    }
}

//Extends the react component to add a few features that are used in a large number of components
export class EditableComponentWithComments extends EditableComponent{
    //Adds a button that opens/closes the comments dialogue
    addCommenting(data){
        return(
            [
                <ActionButton button_icon="comment_new.svg" button_class="comment-button" titletext={gettext("Comments")} handleClick={this.commentClick.bind(this)}/>,
                <CommentBox show={this.state.show_comments} comments={this.props.data.comments} parent={this} renderer={this.props.renderer}/>
            ]
        );
    }
    
    commentClick(evt){
        evt.stopPropagation();
        if(!this.state.show_comments){
            this.reloadComments(true);
        }else(this.setState({show_comments:false}));
    }

    reloadComments(show_comments){
        let props = this.props;
        let data = props.data;
        props.renderer.tiny_loader.startLoad();
        getCommentsForObject(data.id,Constants.object_dictionary[this.objectType],
            (response_data)=>{
                this.props.dispatch(reloadCommentsAction(this.props.data.id,Constants.object_dictionary[this.objectType],response_data.data_package));
                if(show_comments){
                    this.setState({show_comments:true});
                }
                //this.setState({show_comments:true,comment_data:response_data.data_package});
                props.renderer.tiny_loader.endLoad();
            }
        );
    }
}

//Extends the react component to add a few features that are used in a large number of components
export class EditableComponentWithActions extends EditableComponentWithComments{

    //Adds a button that restores the item.
    addRestoreSelf(data,alt_icon){
        let icon=alt_icon || "restore.svg";
        return (
            <ActionButton button_icon={icon} button_class="delete-self-button" titletext={gettext("Restore")} handleClick={this.restoreSelf.bind(this,data)}/>
        );
    }
    
    restoreSelf(data){
        var props = this.props;
        props.renderer.tiny_loader.startLoad();
        restoreSelf(data.id,Constants.object_dictionary[this.objectType],
            (response_data)=>{
                props.renderer.tiny_loader.endLoad();
            }
        );
    }

    //Adds a button that deletes the item (with a confirmation). The callback function is called after the object is removed from the DOM
    addDeleteSelf(data,alt_icon){
        let icon=alt_icon || "rubbish.svg";
        return (
            <ActionButton button_icon={icon} button_class="delete-self-button" titletext={gettext("Delete")} handleClick={this.deleteSelf.bind(this,data)}/>
        );
    }
    
    deleteSelf(data){
        var props = this.props;
        //Temporary confirmation; add better confirmation dialogue later
        if(this.props.renderer)this.props.renderer.selection_manager.deleted(this);
        if((this.objectType=="week"||this.objectType=="column")&&this.props.sibling_count<2){
            alert(gettext("You cannot delete the last ")+this.objectType);
            return;
        }
        if(window.confirm(gettext("Are you sure you want to delete this ")+Constants.get_verbose(this.props.data,this.objectType).toLowerCase()+"?")){
            props.renderer.tiny_loader.startLoad();
            deleteSelf(data.id,Constants.object_dictionary[this.objectType],true,
                (response_data)=>{
                    props.renderer.tiny_loader.endLoad();
                }
            );
        }
    }
    
    //Adds a button that duplicates the item (with a confirmation).
    addDuplicateSelf(data){
        return (
            <ActionButton button_icon="duplicate.svg" button_class="duplicate-self-button" titletext={gettext("Duplicate")} handleClick={this.duplicateSelf.bind(this,data)}/>
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
                props.renderer.tiny_loader.endLoad();
            }
        );
    }
    
    //Adds a button that inserts a sibling below the item. 
    addInsertSibling(data){
        return(
            <ActionButton button_icon="add_new.svg" button_class="insert-sibling-button" titletext={gettext("Insert Below")} handleClick={this.insertSibling.bind(this,data)}/>
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
                props.renderer.tiny_loader.endLoad();
            }
        );
    }
    
    
    //Adds a button that inserts a child to them item
    addInsertChild(data){
        return(
            <ActionButton button_icon="create_new_child.svg" button_class="insert-child-button" titletext={gettext("Insert Child")} handleClick={this.insertChild.bind(this,data)}/>
        );
    }
    
    insertChild(data){
        var props = this.props;
        var type = this.objectType;
        props.renderer.tiny_loader.startLoad();
        insertChild(data.id,Constants.object_dictionary[type],
            (response_data)=>{
                props.renderer.tiny_loader.endLoad();
            }
        );
    }
}

//Extends the react component to add a few features that are used in a large number of components
export class EditableComponentWithSorting extends EditableComponentWithActions{

    makeSortableNode(
        sortable_block,
        parent_id,
        draggable_type,
        draggable_selector,
        axis=false,
        grid=false,
        restrictTo=null,
        handle=false,
        containment=".workflow-container"
    ){
        if(this.props.renderer.read_only)return;
        let cursorAt={};
        if(draggable_type=="weekworkflow")cursorAt={top:20};
        if(draggable_type=="nodeweek")cursorAt={top:20,left:50};
        var props = this.props;
        sortable_block.draggable({
            containment:containment,
            axis:axis,
            cursor:"move",
            cursorAt:cursorAt,
            handle:handle,
            distance:10,
            refreshPositions:true,
            helper:(e,item)=>{
                var helper = $(document.createElement('div'));
                helper.addClass(draggable_type+"-ghost");
                helper.appendTo(".workflow-wrapper > .workflow-container");
                helper.width($(e.target).width());
                return helper;
            },
            start:(e,ui)=>{
                var drag_item = $(e.target);
                if(drag_item.hasClass("placeholder") || drag_item.hasClass("no-drag")){e.preventDefault();return false;}
                if(drag_item.children(".locked:not(.locked-"+user_id+")").length>0){e.preventDefault();return false;}
                $(".workflow-canvas").addClass("dragging-"+draggable_type);
                $(draggable_selector).addClass("dragging");
                var old_parent_id = parent_id;
                drag_item.attr("data-old-parent-id",parent_id);
                drag_item.attr("data-restrict-to",restrictTo);
                var old_index = drag_item.prevAll().length;
                drag_item.attr("data-old-index",old_index);
                props.renderer.selection_manager.changeSelection(null,null);
                this.startSortFunction(parseInt(drag_item.attr("data-child-id")),draggable_type);
                
            },
            drag:(e,ui)=>{
                if(draggable_type=="nodeweek"){
                    let new_target = $("#"+$(e.target).attr("id")+draggable_selector);
                    var delta_x= Math.round((ui.helper.offset().left-$("#"+$(e.target).attr("id")+draggable_selector).children(handle).first().offset().left)/Constants.columnwidth);
                    if(delta_x!=0){
                        let child_id = parseInt($(e.target).attr("data-child-id"));
                        this.sortableColumnChangedFunction(child_id,delta_x,parseInt(new_target.attr("data-column-id")));
                    }
                }
                //$("#"+$(e.target).attr("id")+draggable_selector).addClass("selected");
            },
            stop:(e,ui)=>{
                $(".workflow-canvas").removeClass("dragging-"+draggable_type);
                $(draggable_selector).removeClass("dragging");
                $(document).triggerHandler(draggable_type+"-dropped");
                //$("#"+$(e.target).attr("id")+draggable_selector).removeClass("selected");
            
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
                if(draggable_type=="nodeweek" && drag_item.hasClass("new-node")){
                    drag_helper.addClass("valid-drop");
                    drop_item.addClass("new-node-drop-over");
                }else if(drag_item.is(draggable_selector)){
                    var old_parent_id = parseInt(drag_item.attr("data-old-parent-id"));
                    var old_index = parseInt(drag_item.attr("data-old-index"));
                    if(old_parent_id!=new_parent_id || old_index!=new_index){
                        let child_id = parseInt(drag_item.attr("data-child-id"));

                        if(restrictTo && drag_item.attr("data-restrict-to")!=restrictTo){
                            this.sortableMovedOutFunction(
                                parseInt(drag_item.attr("id")),
                                new_index,draggable_type,new_parent_id,child_id
                            );
                        }else{
                            drag_item.attr("data-old-parent-id",new_parent_id)
                            drag_item.attr("data-old-index",new_index);
                            this.sortableMovedFunction(
                                parseInt(drag_item.attr("id")),
                                new_index,draggable_type,new_parent_id,child_id
                            );
                        }
                        this.lockChild(child_id,true,draggable_type);
                    }
                }else{
//                    console.log(drag_item);
                }
            },
            out:(e,ui)=>{
                var drag_item = ui.draggable;
                var drag_helper = ui.helper;
                var drop_item = $(e.target);
                if(draggable_type=="nodeweek" && drag_item.hasClass("new-node")){
                    drag_helper.removeClass("valid-drop");
                    drop_item.removeClass("new-node-drop-over");
                }
            },
            drop:(e,ui)=>{
                $(".new-node-drop-over").removeClass("new-node-drop-over");
                var drop_item = $(e.target);
                var drag_item = ui.draggable;
                var new_index = drop_item.prevAll().length+1;
                if(draggable_type=="nodeweek" && drag_item.hasClass("new-node")){
                    newNode(this.props.objectID,new_index,drag_item[0].dataDraggable.column,drag_item[0].dataDraggable.column_type,
                        (response_data)=>{
                        
                        }
                    );
                }
            }
        });
        
    }

    sortableMovedOutFunction(){
        console.log("A sortable was moved out, but no specific function was given to the component.");
    }
    
    stopSortFunction(){
        
    }
    
    startSortFunction(id,through_type){
        this.lockChild(id,true,through_type);
    }
    
    
    lockChild(id,lock,through_type){
        let object_type;
        if(through_type=="nodeweek")object_type="node";
        if(through_type=="weekworkflow")object_type="week";
        if(through_type=="columnworkflow")object_type="column";
        if(through_type=="outcomeoutcome")object_type="outcome";
        if(through_type=="outcomeworkflow")object_type="outcome";
        this.props.renderer.lock_update(
            {object_id:id,object_type:object_type},Constants.lock_times.move,lock
        );
    }
    
}

// //Extends the react component to add a few features that are used in a large number of components
// export class EditableComponentWithTrigger extends EditableComponentWithSorting{
    
//     componentDidMount(){
//         this.postMountFunction();
//         if(this.props.renderer&& this.props.renderer.initial_loading)this.props.renderer.container.triggerHandler("component-loaded",this.objectType);
//     }
    
//     postMountFunction(){};

// }



export class NodeLinkSVG extends Component{

    render(){
        
        try{
            const source_transform=Constants.getSVGTranslation(this.props.source_port_handle.select(function(){
                return this.parentNode
            }).attr("transform"));
            const target_transform=Constants.getSVGTranslation(this.props.target_port_handle.select(function(){
                return this.parentNode
            }).attr("transform"));
            const source_point=[parseInt(this.props.source_port_handle.attr("cx"))+parseInt(source_transform[0]),parseInt(this.props.source_port_handle.attr("cy"))+parseInt(source_transform[1])];
            const target_point=[parseInt(this.props.target_port_handle.attr("cx"))+parseInt(target_transform[0]),parseInt(this.props.target_port_handle.attr("cy"))+parseInt(target_transform[1])];

            var path_array = this.getPathArray(source_point,this.props.source_port,target_point,this.props.target_port);
            
            
            var path=(this.getPath(path_array.findPath()));
            
            let style;
            if(this.props.style)style={...this.props.style};
            else style={};
            if(this.props.hovered||this.state.hovered){
                style.stroke="yellow";
                style.opacity=1;
            }else if(this.props.node_selected){
                style.stroke=myColour;
                style.opacity=0.4;
            }else if(this.props.selected){
                style.stroke=myColour;
                style.opacity=1;
            }else if(this.props.lock){
                style.stroke=lock.user_colour;
                style.opacity=1;
            }else{
                style.stroke="black";
                style.opacity=0.4;
            }

            let title;
            if(this.props.title && this.props.title!=""){
                let text_position=path_array.getFractionalPoint(this.props.text_position/100.0);
                title = (
                    <foreignObject width="100" height="100" x={text_position[0]-50} y={text_position[1]-50}>
                    <div class="nodelinkwrapper">
                        <div class="nodelinktext" dangerouslySetInnerHTML={{ __html:this.props.title}} onClick={this.props.clickFunction}></div>
                    </div>
                    </foreignObject>
                )
            }
            
            return (
                <g ref={this.maindiv} stroke="black" fill="none">
                    <path opacity="0" stroke-width="10px" d={path} onClick={this.props.clickFunction} onMouseEnter={()=>this.setState({hovered:true})} onMouseLeave={()=>this.setState({hovered:false})} class={"nodelink"}/>
                    <path style={style} stroke-width="2px" d={path} marker-end="url(#arrow)"/>
                    {title}
                </g>
            );
        }catch(err){console.log("could not draw a node link");return null;}
    }
    
    getPathArray(source_point,source_port,target_point,target_port){
        var source_dims = [this.props.source_dimensions.width,this.props.source_dimensions.height];
        var target_dims = [this.props.target_dimensions.width,this.props.target_dimensions.height];
        var path_generator = new PathGenerator(source_point,source_port,target_point,target_port,source_dims,target_dims);
        return path_generator;
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

    componentDidUpdate(){
        if(this.props.hovered || this.state.hovered || this.props.selected || this.props.node_selected){
            // d3.select(this.maindiv.current).raise();
            // d3.selectAll(".node-ports").raise();
        }
    }
}

export class AutoLinkView extends React.Component{
    constructor(props){
        super(props);
        this.eventNameSpace="autolink"+props.nodeID;
        this.rerenderEvents = "ports-rendered."+this.eventNameSpace;
    }
    
    render(){
        if(!this.source_node||this.source_node.length==0 || !this.source_port_handle || this.source_port_handle.empty()){
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
        
        let node_selected=(this.source_node.attr("data-selected")==='true' || this.target_node.attr("data-selected")==='true');
        let node_hovered=(this.source_node.attr("data-hovered")==='true' || this.target_node.attr("data-hovered")==='true');

        return(
            <div>
                {reactDom.createPortal(
                    <NodeLinkSVG hovered={node_hovered} node_selected={node_selected} source_port_handle={this.source_port_handle} source_port="2" target_port_handle={this.target_port_handle} target_port="0" source_dimensions={source_dims} target_dimensions={target_dims}/>
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
        var style={};
        if($(this.props.node_div.current).css("display")=="none")style["display"]="none";
        var transform;
        if(this.state.node_offset)transform = "translate("+this.state.node_offset.left+","+this.state.node_offset.top+")"
        else transform = "translate(0,0)";
        return(
            <g style={style} class={'node-ports port-'+this.props.nodeID} stroke="black" stroke-width="2" fill="white" transform={transform}>
                {ports}
            </g>
        )
    }
    
    componentDidMount(){
        var thisComponent=this;
        if(!this.props.renderer.read_only)d3.selectAll(
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
        newNodeLink(props.nodeID,target,Constants.port_keys.indexOf(source_port),Constants.port_keys.indexOf(target_port));
    }
}


//A commenting box
export class CommentBox extends Component{
    constructor(props){
        super(props);
        this.input = React.createRef();
        this.submit = React.createRef();
        this.state={};
    }
    
    render(){
        let has_comments=false;
        let has_unread = this.props.comments.filter(
            value=>this.props.renderer.unread_comments.includes(value)
        ).length>0;
        if(this.state.has_rendered){
            has_comments = this.props.comments.length>0;
        }

        let render_div;
        let side_actions = $(this.props.parent.maindiv.current).children(".side-actions").children(".comment-indicator-container");
        if(side_actions.length>0)render_div=side_actions[0];
        else render_div = this.props.parent.maindiv.current;
        let comment_indicator=null;
        if(has_comments){
            let indicator_class = "comment-indicator hover-shade"
            if(has_unread)indicator_class += " unread";
            comment_indicator=reactDom.createPortal(
                <div class={indicator_class} onClick={this.props.parent.commentClick.bind(this.props.parent)}>
                    <img src={iconpath+"comment_new.svg"}/>
                </div>,
                render_div
            );
        }
        
        
        if(!this.props.show){
            return comment_indicator;
        }
        
        let comments;
        if(this.props.comments)comments = this.props.comments.map(comment=>{
            let is_unread = this.props.renderer.unread_comments.indexOf(comment.id)>=0;
            let comment_class = "comment";
            if(is_unread)comment_class+=" unread";
            let text = comment.text.replace(/@\w[@a-zA-Z0-9_.]{1,}/g,(val)=>'<b>'+val+'</b>')
            return (
                <div class={comment_class}>
                    <div class="comment-by">
                        <div class="comment-user">
                            {Constants.getUserDisplay(comment.user)}
                        </div>
                        <div class="comment-on">
                            {comment.created_on}
                        </div>
                    </div>
                    <div class="comment-text" dangerouslySetInnerHTML={{ __html: text }}>
                    </div>
                    {!this.props.renderer.read_only && <div class="mouseover-actions">
                        <div class="action-button" title={gettext("Delete Comment")} onClick={this.removeComment.bind(this,comment.id)}>
                            <img src={iconpath+"rubbish.svg"}/>
                        </div>
                    </div>
                    }
                </div>       
            );        
        });
        
        let top_contents=[];
        top_contents.push(
            <div class="hover-shade" title={gettext("Close")} onClick = {this.props.parent.commentClick.bind(this.props.parent)}>
                <img src = {iconpath+"close.svg"}/>
            </div>
        );
        if(!this.props.renderer.read_only && comments.length>1)top_contents.push(
            <div class="hover-shade" title={gettext("Clear All Comments")} onClick={this.removeAllComments.bind(this)}>
                <img src = {iconpath+"rubbish.svg"}/>
            </div>
        );

        let input_default=gettext("Add a comment");
        if(this.props.comments && this.props.comments.length>0)input_default=gettext("Reply");

        let tag_box;
        if(this.state.tagging){
            tag_box=(
                <div class="comment-tag-box">
                    {this.state.user_list.map((user)=>
                        <div class="user-name hover-shade" onClick={this.addUserTag.bind(this,user)}>
                            {Constants.getUserDisplay(user)}
                        </div>
                    )}
                </div>
            )
        }

        return reactDom.createPortal(
            [
            <div class="comment-box" onClick={(evt)=>evt.stopPropagation()} onMouseDown={(evt)=>evt.stopPropagation()}>
                <div class="comment-top-row">
                    {top_contents}
                </div>
                <hr/>
                <div class="comment-block">
                    {comments}
                </div>
                {(this.props.renderer.add_comments) && 
                    <div class="comment-input-line">
                        <textarea class="comment-input" placeholder={input_default} contentEditable="true" onInput={this.textChange.bind(this)} ref={this.input}/>
                        <img ref={this.submit} src={iconpath+"add_new.svg"} class="add-comment-button hidden hover-shade" onClick={this.appendComment.bind(this)} title={gettext("Submit")}/>
                    </div>
                }
            </div>,
            tag_box,
            comment_indicator
            ],
            render_div
        )
    }

    addUserTag(user){
        let cursor_pos = this.tag_position;
        let current_value = this.input.current.value;
        let to_add = "";
        if(cursor_pos > 0 && current_value[cursor_pos-1]!=" ")to_add+=" ";
        to_add+="@"+user.username+" ";
        let new_value = current_value.slice(0,cursor_pos)+to_add+current_value.slice(cursor_pos+1);
        this.input.current.value = new_value;
        this.input.current.selectionStart=this.input.current.value.length;
        this.setState({tagging:false});

    }

    textChange(evt){
        if($(this.input.current)[0].value && $(this.input.current)[0].value!=""){
            $(this.submit.current).removeClass("hidden");
        }else{
            $(this.submit.current).addClass("hidden");
        }
        if(evt.nativeEvent && evt.nativeEvent.data == "@"){
            this.tag_position = this.input.current.selectionStart-1;
            let renderer = this.props.renderer;
            renderer.tiny_loader.startLoad();
            getUsersForObject(this.props.renderer.workflowID,"workflow",(response)=>{
                renderer.tiny_loader.endLoad();
                this.setState({tagging:true,user_list:response.editors.concat(response.commentors)});
            });
        }else if(this.state.tagging){
            this.setState({tagging:false});
        }
    }
    
    removeComment(id){
        let parent = this.props.parent;
        let props = parent.props;
        if(window.confirm(gettext("Are you sure you want to permanently clear this comment?"))){
            removeComment(props.objectID,Constants.object_dictionary[parent.objectType],id,
                parent.reloadComments.bind(parent)
            );
        }
    }

    removeAllComments(){
        let parent = this.props.parent;
        let props = parent.props;
        if(window.confirm(gettext("Are you sure you want to permanently clear all comments from this object?"))){
            removeAllComments(props.objectID,Constants.object_dictionary[parent.objectType],
                parent.reloadComments.bind(parent)
            );
        }
    }
    
    appendComment(){
        let text=$(this.input.current)[0].value;
        if(!text)return;
        let parent = this.props.parent;
        let props = parent.props;
        $(this.input.current)[0].value="";
        $(this.submit.current).addClass("hidden");
        addComment(props.objectID,Constants.object_dictionary[parent.objectType]   ,text,parent.reloadComments.bind(parent));
    }

    componentDidMount(){
        this.setState({has_rendered:true})
    }

    componentDidUpdate(prevProps){
        if(prevProps.show && !this.props.show){
            this.commentsSeen();
            if(this.state.tagging)this.setState({tagging:false});
        }
    }


    commentsSeen(){
        let unread_comments = this.props.renderer.unread_comments.slice();
        let comments = this.props.comments.map(comment=>comment.id);
        this.props.renderer.unread_comments = unread_comments.filter(comment=>comments.indexOf(comment)<0);
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
            <div class="title-text" title={text} dangerouslySetInnerHTML={{ __html: text }}></div>
        )
    }
}

export class CollapsibleText extends Component{

    render(){
        let css_class="";
        if(this.props.css_class)css_class=this.props.css_class+" ";
        css_class += "title-text collapsible-text";
        let drop_text = gettext("show more");
        if(this.state.is_dropped){
            css_class+=" dropped";
            drop_text = gettext("show less");
        }
        let overflow;
        if(this.state.overflow)overflow=(
            <div onClick={(evt)=>{
                this.setState({is_dropped:!this.state.is_dropped});
                evt.stopPropagation();
            }} class="collapsed-text-show-more">{drop_text}</div>
        );

        var text = this.props.text;
        if((this.props.text==null || this.props.text=="") && this.props.defaultText!=null){
            text=this.props.defaultText;
        }
        return (
            [
                <div ref={this.maindiv} class={css_class} title={text} dangerouslySetInnerHTML={{ __html: text }}></div>,
                overflow,
            ]
        )
    }
    componentDidMount(){
        this.checkSize();
    }

    componentDidUpdate(){
        this.checkSize();
    }

    checkSize(){
        if(this.state.is_dropped)return;
        if(this.maindiv.current.scrollHeight>this.maindiv.current.clientHeight){
            if(!this.state.overflow)this.setState({overflow:true});
        }else{
            if(this.state.overflow)this.setState({overflow:false})
        }
    }
}

export class SimpleWorkflow extends React.Component{
    constructor(props){
        super(props);
        this.maindiv = React.createRef();
    }
    
    render(){
        var data = this.props.workflow_data;
        var css_class = "simple-workflow workflow-for-menu hover-shade "+data.type;
        
        return(
            <div ref={this.maindiv} class={css_class} onClick={this.clickAction.bind(this)} onMouseDown={(evt)=>{evt.preventDefault()}}>
                <div class="workflow-top-row">
                    <WorkflowTitle class_name="workflow-title" data={data}/>
                    {this.getTypeIndicator()}
                </div>
            </div>
        );
    }
    

    clickAction(){
        if(this.props.selectAction){
            this.props.selectAction(this.props.workflow_data.id);
        }else{
            window.location.href=update_path[this.props.workflow_data.type].replace("0",this.props.workflow_data.id);
        }
    }

    getTypeIndicator(){
        let data = this.props.workflow_data;
        let type=data.type
        let type_text = gettext(type);
        if(type=="liveproject")type_text=gettext("classroom");
        if(data.is_strategy)type_text+=gettext(" strategy");
        return (
            <div class={"workflow-type-indicator "+type}>{type_text}</div>
        );
    }
}

//Title text for a workflow
export class WorkflowTitle extends React.Component{
    
    render(){
        let data = this.props.data;
        let text = data.title;
        
        if(data.code)text = data.code+" - "+text;
        
        if(text==null || text==""){
            text=gettext("Untitled");
        }
        if(data.url=="noaccess" || data.url =="nouser"){
            text+=gettext(" (no access)");
        }
        if(data.deleted){
            text+=" (deleted)";
        }
        let href = data.url;
        if(!data.url)href=update_path[data.type].replace("0",data.id);

        if(this.props.no_hyperlink || data.url == "noaccess" || data.url == "nouser"){
            return (
                <div class={this.props.class_name} title={text} dangerouslySetInnerHTML={{ __html: text }}></div>
            )
        }else{
            return (
                <a onClick={(evt)=>evt.stopPropagation()} href={href} class={this.props.class_name} title={text} dangerouslySetInnerHTML={{ __html: text }}></a>
            )
        }
    }
}

//Title text for a week
export class WeekTitle extends React.Component{
    
    render(){
        let data = this.props.data;
        let default_text = data.week_type_display+" "+(this.props.rank+1);
        return (
            <TitleText text={data.title} defaultText={default_text}/>
        )
    }
}

//Title text for a node
export class NodeTitle extends React.Component{
    
    render(){
        let data = this.props.data;
        let text;
        if(data.represents_workflow && data.linked_workflow_data){
            text = data.linked_workflow_data.title;
            if(data.linked_workflow_data.code)text = data.linked_workflow_data.code+" - "+text;
        }
        else text = data.title;
            
        if(text==null || text==""){
            text=gettext("Untitled");
        }
        
        return (
            <div class="node-title" title={text} dangerouslySetInnerHTML={{ __html: text }}></div>
        )
    }
}

//Title text for an assignment
export class AssignmentTitle extends React.Component{
    
    render(){
        let data = this.props.data;
        let text;
        if(data.task.represents_workflow && data.task.linked_workflow_data){
            text = data.task.linked_workflow_data.title;
            if(data.task.linked_workflow_data.code)text = data.task.linked_workflow_data.code+" - "+text;
        }
        else text = data.task.title;
            
        if(text==null || text==""){
            text=gettext("Untitled");
        }
        if(this.props.user_role==Constants.role_keys.teacher){
            return (
                <a href={update_path.liveassignment.replace("0",data.id)} class="workflow-title hover-shade" title={text} dangerouslySetInnerHTML={{ __html: text }}></a>
            )
        }else{
            return (
                <span class="workflow-title" title={text} dangerouslySetInnerHTML={{ __html: text }}></span>
            )  
        }
    }
}

//Title for an outcome
export class OutcomeTitle extends React.Component{
    render(){
        let data = this.props.data;
        let text = data.title;
        if(data.title==null || data.title==""){
            text=gettext("Untitled");
        }
        
        return (
            <div title={this.props.hovertext} class="title-text">
                <span>{this.props.prefix+" - "}</span>
                <span dangerouslySetInnerHTML={{ __html: text }}></span>
            </div>
        )
    }

}

//Returns the outcome title as a string
export function getOutcomeTitle(data,prefix){
    let text = data.title;
    if(data.title==null || data.title==""){
        text=gettext("Untitled");
    }

    return prefix+" - "+ text;

}

//Quill div
export class QuillDiv extends React.Component{
    constructor(props){
        super(props);
        this.maindiv = React.createRef();
        if(props.text)this.state={charlength:props.text.length};
        else this.state={charlength:0};
    }
    
    render(){
        
        return(
            <div>
                <div ref={this.maindiv} class="quill-div">

                </div>
                <div class={"character-length"}>{this.state.charlength+" "+gettext("characters")}</div>
            </div>
        );
    }
    
    componentDidMount(){
        let renderer=this.props.renderer;
        let quill_container = this.maindiv.current;
        let toolbarOptions = [['bold','italic','underline'],[{'script':'sub'},{'script':'super'}],[{'list':'bullet'},{'list':'ordered'}],['link']/*,['formula']*/];
        let quill = new Quill(quill_container,{
            theme:'snow',
            modules:{
                toolbar:toolbarOptions
            },
            placeholder:this.props.placeholder
        });
        this.quill=quill;
        if(this.props.text)quill.clipboard.dangerouslyPasteHTML(this.props.text);
        quill.on('text-change',()=>{
            let text = quill_container.childNodes[0].innerHTML.replace(/\<p\>\<br\>\<\/p\>\<ul\>/g,"\<ul\>");
            this.props.textChangeFunction(text);
            this.setState({charlength:text.length});
        });
        let toolbar = quill.getModule('toolbar');
        toolbar.defaultLinkFunction=toolbar.handlers['link'];
        toolbar.addHandler("link",function customLinkFunction(value){
            var select = quill.getSelection();
            if(value&&select['length']==0&&!renderer.read_only){
                quill.insertText(select['index'],'link');
                quill.setSelection(select['index'],4);
            }
            this.defaultLinkFunction(value);
        });
        this.quill.enable(!this.props.disabled);
        
    }
        
    componentDidUpdate(prevProps, prevState){
        if(prevProps.disabled!=this.props.disabled){
            if(prevProps.text!=this.props.text)this.quill.clipboard.dangerouslyPasteHTML(this.props.text,"silent");
            this.quill.enable(!this.props.disabled);
        }
        $(this.maindiv.current).find("a").click(()=>{
            $(this).attr('target','_blank');
        });
    }
    
}

export class Slider extends React.Component{
    render(){
        return (
            <label class="switch">
                <input type="checkbox" checked={this.props.checked} onChange={this.props.toggleAction.bind(this)}/>
                <span class="slider round"></span>
            </label>
        );
    }
}

export class DatePicker extends React.Component{
    constructor(props){
        super(props);
        this.input = React.createRef();
    }
    render(){
        let disabled=false;
        if(this.props.disabled)disabled=true;
        return (
            <input disabled={disabled} ref={this.input} id={this.props.id} defaultValue={this.props.default_value}/>
        );
    }
    componentDidMount(){
        $(this.input.current).flatpickr({
            enableTime:true,
            dateFormat:'Z',
            altInput:true,
            altFormat:"D M J, Y - H:i",
            onChange:(dates,datestring)=>{
                this.props.onChange(datestring);
            },
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
        this.full_array=[];
    }
    
    //finds and returns the path
    findPath(){
        try{
            this.findNextPoint();
        }catch(err){console.log("error calculating path")};
        this.full_array=this.joinArrays();
        return this.full_array;
    }
    
    //gets the total length of our path
    getPathLength(){
        let length=0;
        for(var i=1;i<this.full_array.length;i++){
            let seg_len = mathnorm(mathsubtract(this.full_array[i],this.full_array[i-1]));
            length+=seg_len;
        }
        return length;
    }
    
    //gets the point at the given fraction of our path length
    getFractionalPoint(position){
        let length = this.getPathLength();
        if(length==0)return [0,0];
        let point = this.full_array[1];
        let run_length=0;
        let target_length=length*position;
        for(var i=1;i<this.full_array.length;i++){
            let seg = mathsubtract(this.full_array[i],this.full_array[i-1]);
            let seg_len = mathnorm(seg);
            if(run_length+seg_len<target_length)run_length+=seg_len;
            else{
                let remaining_len=target_length-run_length;
                return mathadd(this.full_array[i-1],mathmultiply(seg,remaining_len/seg_len));
            }
        }
        return point;
        
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



