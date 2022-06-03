import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON, OutcomeTitle} from "./ComponentJSON.js";
import OutcomeOutcomeView from "./OutcomeOutcomeView.js";
import {OutcomeBarOutcomeOutcomeView, SimpleOutcomeOutcomeView, SimpleOutcomeOutcomeViewUnconnected, TableOutcomeOutcomeView} from "./OutcomeOutcomeView.js";
import {TableOutcomeGroup, TableTotalCell} from "./OutcomeNode.js";
import {getOutcomeByID, getOutcomeHorizontalLinkByID} from "./FindState.js";
import {moveOutcomeOutcome} from "./Reducers.js";
import {updateOutcomehorizontallinkDegree,insertedAt, updateValueInstant} from "./PostFunctions";
import * as Constants from "./Constants";

//Basic component representing an outcome
class OutcomeView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcome";
        if(props.data.depth==0)this.objectType="outcome_base";
        this.children_block = React.createRef();
    }
    
    render(){
        let data = this.props.data;
        if(Constants.checkSetHidden(data,this.props.object_sets))return null;
        var children = data.child_outcome_links.map((outcomeoutcome)=>
            <OutcomeOutcomeView key={outcomeoutcome} objectID={outcomeoutcome} parentID={data.id} renderer={this.props.renderer} show_horizontal={this.props.show_horizontal} parent_depth={this.props.data.depth}/>
        );
        
        
        let outcomehorizontallinks = data.outcome_horizontal_links_unique.map((horizontal_link)=>
            <OutcomeHorizontalLinkView key={horizontal_link} objectID={horizontal_link} renderer={this.props.renderer}/>
        );
        let outcomeDiv;
        if(this.props.show_horizontal && outcomehorizontallinks.length>0){
            outcomeDiv = (
                <div class="outcome-node-indicator">
                    <div class={"outcome-node-indicator-number"}>...</div>
                    <div class={"outcome-node-container"}>{outcomehorizontallinks}</div>
                </div>
            );
        }
        
        let mouseover_actions = [];
        if(!read_only){
            mouseover_actions.push(this.addInsertSibling(data));
            mouseover_actions.push(this.addDuplicateSelf(data));
            mouseover_actions.push(this.addDeleteSelf(data));
            if(data.depth<2)mouseover_actions.push(this.addInsertChild(data));
        }
        mouseover_actions.push(this.addCommenting(data));
        
        let dropIcon;
        if(data.is_dropped)dropIcon = "droptriangleup";
        else dropIcon = "droptriangledown";
        
        let droptext;
        if(data.is_dropped)droptext=gettext("hide");
        else droptext = gettext("show ")+children.length+" "+ngettext("descendant","descendants",children.length);
        
        if(!read_only && data.depth<2 && children.length==0)children.push(
            <div class="outcome-outcome" style={{height:"5px"}}></div>
        );
        
        let style={};
        if(data.lock){
            style.border="2px solid "+data.lock.user_colour;
        }
        
        let css_class="outcome outcome-"+data.id;
        if(data.is_dropped)css_class+=" dropped";
        if(data.lock)css_class+=" locked locked-"+data.lock.user_id;
        
        return(
            <div style={style}
            class={css_class}
            ref={this.maindiv} 
            onClick={(evt)=>this.props.renderer.selection_manager.changeSelection(evt,this)}>
                <div class="outcome-title">
                    <OutcomeTitle data={this.props.data} titles={this.props.titles} rank={this.props.rank}/>
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
                <ol class={"children-block children-block-"+this.props.data.depth} id={this.props.objectID+"-children-block"} ref={this.children_block}>
                    {children}
                </ol>
                {(!read_only && data.depth < 2) && <div class="outcome-create-child" onClick = {this.insertChild.bind(this,data)}>{gettext("+ Add New")}</div>
                }
                <div class="mouseover-actions">
                    {mouseover_actions}
                </div>
                {
                    this.addEditable(data)
                }
                
                {outcomeDiv}
            </div>
        );
    }
    
    postMountFunction(){
        if(this.props.show_horizontal)this.makeDragAndDrop();
//        if(this.props.show_horizontal)this.updateIndicator();
    }

    componentDidUpdate(){
        if(this.props.show_horizontal)this.makeDragAndDrop();
//        if(this.props.show_horizontal)this.updateIndicator();
    }
//
//    updateIndicator(){
//        let indicator = $(this.maindiv.current).children(".outcome-node-indicator");
//        let indicator_number = indicator.children(".outcome-node-indicator-number");
//        let number = indicator.children(".outcome-node-container").children().length;
//        indicator_number.text(number);
//        if(number>0)indicator.show();
//        else indicator.hide();
//    }

    makeDragAndDrop(){
        this.makeSortableNode($(this.children_block.current).children(".outcome-outcome").not("ui-draggable"),this.props.objectID,"outcomeoutcome",".outcome-outcome-"+this.props.data.depth,false,false,".children-block-"+this.props.data.depth,".outcome");
        if(this.props.data.depth==0)this.makeDroppable();
    }


    toggleDrop(){
        updateValueInstant(this.props.objectID,Constants.object_dictionary[this.objectType],{is_dropped:!this.props.data.is_dropped});
    }

    sortableMovedFunction(id,new_position,type,new_parent,child_id){
        this.props.renderer.micro_update(moveOutcomeOutcome(id,new_position,new_parent,child_id));
        insertedAt(this.props.renderer,child_id,"outcome",new_parent,"outcome",new_position,"outcomeoutcome");
    }

    stopSortFunction(){
        
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
                    updateOutcomehorizontallinkDegree(props.objectID,drag_item[0].dataDraggable.outcome,1,
                        (response_data)=>{
                            props.renderer.tiny_loader.endLoad();
                        }
                    );
                }
            }
        });
    }
    
    
}
const mapOutcomeStateToProps = (state,own_props)=>(
    getOutcomeByID(state,own_props.objectID)
)
export default connect(
    mapOutcomeStateToProps,
    null
)(OutcomeView)


//Basic component representing an outcome in the outcome bar
export class OutcomeBarOutcomeViewUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcome";
        this.children_block = React.createRef();
        this.state={is_dropped:(props.data.depth<1)};
    }
    
    render(){
        let data = this.props.data;
        if(Constants.checkSetHidden(data,this.props.object_sets))return null;
        var children = data.child_outcome_links.map((outcomeoutcome)=>
            <OutcomeBarOutcomeOutcomeView key={outcomeoutcome} objectID={outcomeoutcome} parentID={data.id} renderer={this.props.renderer}/>
        );
                
        let dropIcon;
        if(this.state.is_dropped)dropIcon = "droptriangleup";
        else dropIcon = "droptriangledown";
        
        let droptext;
        if(this.state.is_dropped)droptext=gettext("hide");
        else droptext = gettext("show ")+children.length+" "+ngettext("descendant","descendants",children.length);
        
        return(
            <div
            class={
                "outcome"+((this.state.is_dropped && " dropped")||"")+" outcome-"+data.id
            }
            
            ref={this.maindiv}>
                <div class="outcome-title" >
                    <OutcomeTitle data={this.props.data} titles={this.props.titles} rank={this.props.rank}/>
                </div>
                <input class="outcome-toggle-checkbox" type="checkbox" title="Toggle highlighting" onChange={this.clickFunction.bind(this)}/>
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
            </div>
            
        );
    }
    
    toggleDrop(evt){
        evt.stopPropagation();
        this.setState({is_dropped:(!this.state.is_dropped)});
    }


    makeDraggable(){
        let draggable_selector = "outcome";
        let draggable_type = "outcome";
        $(this.maindiv.current).draggable({
            helper:(e,item)=>{
                var helper = $(document.createElement('div'));
                helper.addClass("outcome-ghost");
                helper.appendTo(document.body);
                return helper;
            },
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

    clickFunction(evt){
        if(evt.target.checked){
            this.toggleCSS(true,"toggle");
        }else{
            this.toggleCSS(false,"toggle");
        }
    }

    toggleCSS(is_toggled,type){
        if(is_toggled){
            $(".outcome-"+this.props.data.id).addClass("outcome-"+type);
            $(".outcome-"+this.props.data.id).parents(".node").addClass("outcome-"+type);
            $(".outcome-"+this.props.data.id).parents(".workflow-details .outcome").addClass("outcome-"+type);
        }else{
            $(".outcome-"+this.props.data.id).removeClass("outcome-"+type);
            $(".outcome-"+this.props.data.id).parents(".node").removeClass("outcome-"+type);
            $(".outcome-"+this.props.data.id).parents(".workflow-details .outcome").removeClass("outcome-"+type);
        }
    }
    
    postMountFunction(){
        this.makeDraggable();
        $(this.maindiv.current)[0].dataDraggable={outcome:this.props.data.id}
        $(this.maindiv.current).mouseenter((evt)=>{
            this.toggleCSS(true,"hover");
        });
        $(this.maindiv.current).mouseleave((evt)=>{
            this.toggleCSS(false,"hover");
        });
        $(this.children_block.current).mouseleave((evt)=>{
            this.toggleCSS(true,"hover");
        });
        $(this.children_block.current).mouseenter((evt)=>{
            this.toggleCSS(false,"hover");
        });
    }

}
export const OutcomeBarOutcomeView = connect(
    mapOutcomeStateToProps,
    null
)(OutcomeBarOutcomeViewUnconnected)


//Basic component representing an outcome in a node, or somewhere else where it doesn't have to do anything
export class SimpleOutcomeViewUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcome";
        this.children_block = React.createRef();
        this.state={is_dropped:false};
    }
    
    render(){
        let data = this.props.data;
        if(Constants.checkSetHidden(data,this.props.object_sets))return null;
        var children = data.child_outcome_links.map((outcomeoutcome)=>
            this.getChildType(outcomeoutcome)
        );
        
                
        let dropIcon;
        if(this.state.is_dropped)dropIcon = "droptriangleup";
        else dropIcon = "droptriangledown";
        
        let droptext;
        if(this.state.is_dropped)droptext=gettext("hide");
        else droptext = gettext("show ")+children.length+" "+ngettext("descendant","descendants",children.length);
        
        let comments=this.addCommenting();
        
        let edit;
        let onClick;
        if(this.props.edit)edit=this.addEditable(data,true);
        onClick=(evt)=>this.props.renderer.selection_manager.changeSelection(evt,this);
        
        
        let style={};
        if(data.lock){
            style.border="2px solid "+data.lock.user_colour;
        }
        
        let css_class="outcome outcome-"+data.id;
        if(this.state.is_dropped)css_class+=" dropped";
        if(data.lock)css_class+=" locked locked-"+data.lock.user_id;
        
        return(
            <div class={css_class} style={style}
            ref={this.maindiv} onClick={onClick}>
                <div class="outcome-title">
                    <OutcomeTitle data={data} rank={this.props.rank} titles={this.props.titles}/>
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
                    {comments}
                </div>
                {edit}
            </div>
            
        );
    }
    
    toggleDrop(){
        this.setState({is_dropped:(!this.state.is_dropped)});
    }

    getChildType(outcomeoutcome){
        let data = this.props.data;
        return(
            <SimpleOutcomeOutcomeView key={outcomeoutcome} objectID={outcomeoutcome} parentID={data.id} renderer={this.props.renderer} comments={this.props.comments} edit={this.props.edit}/>
        );
    }

    postMountFunction(){
        if(this.props.checkHidden)this.props.checkHidden();
    }

    componentDidUpdate(){
        if(this.props.checkHidden)this.props.checkHidden();
    }



}
export const SimpleOutcomeView = connect(
    mapOutcomeStateToProps,
    null
)(SimpleOutcomeViewUnconnected)

//Basic component representing an outcome inside a table
//The component must keep track of both the completion status it receives from descendant outcomes (for each node) and that it gets from its own table cells (also for each node). The completion status it receives from its own table cells is then combined with that it receives from its descendant outcomes to compute whether or not an outcome is achieved in the grand total column.
//To receive updates from the child outcomes, the updateParentCompletion function is passed to the child outcomes. This is called any time a table cell is updated, adding the the node-outcome pair. descendant_completion_status has the format {node_id:{outcome_id:degree}}.
class TableOutcomeViewUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcome";
        this.children_block = React.createRef();
        this.state={descendant_completion_status:{}};
    }
    
    render(){
        let data = this.props.data;
        
        var children = data.child_outcome_links.map((outcomeoutcome)=>
            <TableOutcomeOutcomeView renderer={this.props.renderer} key={outcomeoutcome} objectID={outcomeoutcome} parentID={data.id} nodecategory={this.props.nodecategory} updateParentCompletion={this.childUpdatedFunction.bind(this)} descendant_completion_status={this.state.descendant_completion_status} outcomes_type={this.props.outcomes_type}/>
        );

        let outcomeGroups = this.props.nodecategory.map((nodecategory)=>
            <TableOutcomeGroup renderer={this.props.renderer} nodes={nodecategory.nodes} outcomeID={this.props.data.id} updateParentCompletion={this.childUpdatedFunction.bind(this)} descendant_completion_status={this.state.descendant_completion_status} outcomes_type={this.props.outcomes_type}/>
                                                        
                                                         
        );
                
        let dropIcon;
        if(data.is_dropped)dropIcon = "droptriangleup";
        else dropIcon = "droptriangledown";
        
        let droptext;
        if(data.is_dropped)droptext=gettext("hide");
        else droptext = gettext("show ")+children.length+" "+ngettext("descendant","descendants",children.length);
        

        
        return(
            <div
            class={
                "outcome depth-"+data.depth+((data.is_dropped && " dropped")||"")
            }
            ref={this.maindiv}>
                <div class = "outcome-row">
                    <div class="outcome-head" style={{paddingLeft:data.depth*12}}>
                        <div class="outcome-title">
                            <OutcomeTitle data={this.props.data} titles={this.props.titles} rank={this.props.rank}/>
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
                    </div>
                    <div class="outcome-cells">
                        {outcomeGroups}
                        <div class="table-cell blank-cell"></div>
                        <TableTotalCell grand_total={true} outcomes_type={this.props.outcomes_type} outcomeID={data.id} descendant_completion_status={this.state.descendant_completion_status}/>
                    </div>
                </div>
                <div class="children-block" id={this.props.objectID+"-children-block"} ref={this.children_block}>
                    {children}
                </div>
            </div>
            
        );
    }
    
    
    toggleDrop(){
        updateValueInstant(this.props.objectID,Constants.object_dictionary[this.objectType],{is_dropped:!this.props.data.is_dropped});
    }

    childUpdatedFunction(node_id,outcome_id,value){
        
        this.setState((prevState,props)=>{
            let new_descendant_completion = {...prevState.descendant_completion_status};
            if(!new_descendant_completion[node_id] && value){
                new_descendant_completion[node_id]={};
                new_descendant_completion[node_id][outcome_id]=value;
            }else if(value){
                new_descendant_completion[node_id]={...new_descendant_completion[node_id]};
                new_descendant_completion[node_id][outcome_id]=value;
            }else{
                new_descendant_completion[node_id]={...new_descendant_completion[node_id]};
                delete new_descendant_completion[node_id][outcome_id];
                if($.isEmptyObject(new_descendant_completion[node_id]))delete new_descendant_completion[node_id];
            }
            return {...prevState,descendant_completion_status:new_descendant_completion};
            
        });        
        if(this.props.updateParentCompletion)this.props.updateParentCompletion(node_id,outcome_id,value);
    }


}
export const TableOutcomeView = connect(
    mapOutcomeStateToProps,
    null
)(TableOutcomeViewUnconnected)


/*

Horizontal OutcomeLinking

*/
//Basic component representing an outcome to parent outcome
class OutcomeHorizontalLinkViewUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="outcomehorizontallink";
    }
    
    render(){
        let data = this.props.data;
        //It's possible we don't actually have this data, if the horizontal link is dead
        if(!data)return null;
        return (
            <div class={"outcome-node outcome-"+data.id} id={data.id} ref={this.maindiv}>
                {!read_only && <div>
                    {this.addDeleteSelf(data,"close.svg")}
                </div>
                }
                <SimpleOutcomeView checkHidden={this.checkHidden.bind(this)} objectID={data.parent_outcome} parentID={this.props.parentID} throughParentID={data.id}/>
            </div>
        );
    }
    
    deleteSelf(data){
        let props=this.props;
        //Temporary confirmation; add better confirmation dialogue later
        if(window.confirm(gettext("Are you sure you want to delete this "+Constants.object_dictionary[this.objectType]+"?"))){
            props.renderer.tiny_loader.startLoad();
            updateOutcomehorizontallinkDegree(data.outcome,data.parent_outcome,0,(response_data)=>{
                props.renderer.tiny_loader.endLoad();
            });
           
        }
    }

    checkHidden(){
        if($(this.maindiv.current).children(".outcome").length==0)$(this.maindiv.current).css("display","none");
        else $(this.maindiv.current).css("display","");
        let indicator = $(this.maindiv.current).closest(".outcome-node-indicator")
        if(indicator.length>=0){
            let num_outcomenodes = indicator.children(".outcome-node-container").children('.outcome-node:not([style*="display: none"])').length;
            indicator.children(".outcome-node-indicator-number").html(num_outcomenodes);
            if(num_outcomenodes==0)indicator.css("display","none");
            else indicator.css("display","");
        }
    }

    postMountFunction(){
        this.checkHidden();
    }

    componentDidUpdate(){
        this.checkHidden();
    }

    componentWillUnmount(){
        this.checkHidden();
    }
}
const mapOutcomeHorizontalLinkStateToProps = (state,own_props)=>(
    getOutcomeHorizontalLinkByID(state,own_props.objectID)
)
export const OutcomeHorizontalLinkView = connect(
    mapOutcomeHorizontalLinkStateToProps,
    null
)(OutcomeHorizontalLinkViewUnconnected)

//class OutcomeViewForHorizontalUnconnected extends SimpleOutcomeViewUnconnected{
//    constructor(props){
//        super(props);
//        this.objectType="outcome";
//        this.children_block = React.createRef();
//        this.state={is_dropped:false};
//    }
//    
//    render(){
//        let data = this.props.data;
//        
//        var children = data.child_outcome_links.map((outcomeoutcome)=>
//            this.getChildType(outcomeoutcome)
//        );
//                
//        let dropIcon;
//        if(this.state.is_dropped)dropIcon = "droptriangleup";
//        else dropIcon = "droptriangledown";
//        
//        let droptext;
//        if(this.state.is_dropped)droptext=gettext("hide");
//        else droptext = gettext("show ")+children.length+" "+ngettext("descendant","descendants",children.length);
//        
//        return(
//            <div
//            class={
//                "outcome"+((this.state.is_dropped && " dropped")||"")+" outcome-"+data.id
//            }
//            ref={this.maindiv}>
//                <div class="outcome-title">
//                    <TitleText text={data.title} defaultText={"Click to edit"}/>
//                </div>
//                {children.length>0 && 
//                    <div class="outcome-drop" onClick={this.toggleDrop.bind(this)}>
//                        <div class = "outcome-drop-img">
//                            <img src={iconpath+dropIcon+".svg"}/>
//                        </div>
//                        <div class = "outcome-drop-text">
//                            {droptext}
//                        </div>
//                    </div>
//                }
//                <div class="children-block" id={this.props.objectID+"-children-block"} ref={this.children_block}>
//                    {children}
//                </div>
//            </div>
//            
//        );
//    }
//    
//    toggleDrop(){
//        this.setState({is_dropped:(!this.state.is_dropped)});
//    }
//    
//    getChildType(outcomeoutcome){
//        let data = this.props.data;
//        return (
//            <OutcomeOutcomeViewForHorizontal key={outcomeoutcome} objectID={outcomeoutcome} parentID={data.id} renderer={this.props.renderer}/>
//        );
//    }
//}
//const mapParentOutcomeStateToProps = (state,own_props)=>(
//    getParentOutcomeByID(state,own_props.objectID)
//)
//export const OutcomeViewForHorizontal = connect(
//    mapParentOutcomeStateToProps,
//    null
//)(OutcomeViewForHorizontalUnconnected)
//
//class OutcomeOutcomeViewForHorizontalUnconnected extends SimpleOutcomeOutcomeViewUnconnected{
//    getChildType(){
//        let data = this.props.data;
//        return (
//            <OutcomeViewForHorizontal objectID={data.child} parentID={this.props.parentID} throughParentID={data.id}/>
//        )
//    }
//}
//const mapParentOutcomeOutcomeStateToProps = (state,own_props)=>(
//    getParentOutcomeOutcomeByID(state,own_props.objectID)
//)
//export const OutcomeOutcomeViewForHorizontal = connect(
//    mapParentOutcomeOutcomeStateToProps,
//    null
//)(OutcomeOutcomeViewForHorizontalUnconnected)



