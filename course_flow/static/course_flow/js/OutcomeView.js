import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ActionButton, Component, EditableComponentWithSorting, EditableComponentWithComments, OutcomeTitle} from "./ComponentJSON";
import OutcomeOutcomeView from "./OutcomeOutcomeView";
import {OutcomeBarOutcomeOutcomeView, SimpleOutcomeOutcomeView, SimpleOutcomeOutcomeViewUnconnected, TableOutcomeOutcomeView} from "./OutcomeOutcomeView";
import {TableOutcomeGroup, TableTotalCell} from "./OutcomeNode";
import {getOutcomeByID, getOutcomeHorizontalLinkByID} from "./FindState";
import {moveOutcomeOutcome} from "./Reducers";
import {updateOutcomenodeDegree, updateOutcomehorizontallinkDegree,insertedAt, updateValueInstant} from "./PostFunctions";
import * as Constants from "./Constants";

//Basic component representing an outcome
class OutcomeView extends EditableComponentWithSorting{
    
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
        let side_actions = [];
        if(this.props.show_horizontal && outcomehorizontallinks.length>0){
            side_actions.push(
                <div class="outcome-node-indicator">
                    <div class={"outcome-node-indicator-number"}>...</div>
                    <div class={"outcome-node-container"}>{outcomehorizontallinks}</div>
                </div>
            );
        }
        
        let mouseover_actions = [];
        if(!this.props.renderer.read_only){
            mouseover_actions.push(this.addInsertSibling(data));
            mouseover_actions.push(this.addDuplicateSelf(data));
            mouseover_actions.push(this.addDeleteSelf(data));
            if(data.depth<2)mouseover_actions.push(this.addInsertChild(data));
        }
        if(this.props.renderer.view_comments)mouseover_actions.push(this.addCommenting(data));
        
        let dropIcon;
        if(data.is_dropped)dropIcon = "droptriangleup";
        else dropIcon = "droptriangledown";
        
        let droptext;
        if(data.is_dropped)droptext=gettext("hide");
        else droptext = gettext("show ")+children.length+" "+ngettext("descendant","descendants",children.length);
        
        if(!this.props.renderer.read_only && data.depth<2 && children.length==0)children.push(
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
                    <OutcomeTitle data={this.props.data} prefix={this.props.prefix} hovertext={this.props.hovertext}/>
                </div>
                {data.child_outcome_links.length>0 && 
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
                {(!this.props.renderer.read_only && data.depth < 2) && <div class="outcome-create-child" onClick = {this.insertChild.bind(this,data)}>{gettext("+ Add New")}</div>
                }
                <div class="mouseover-actions">
                    {mouseover_actions}
                </div>
                {
                    this.addEditable(data)
                }
                
                <div class="side-actions">
                    {side_actions}
                    <div class="comment-indicator-container"></div>
                </div>
            </div>
        );
    }
    
    componentDidMount(){
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
        this.makeSortableNode($(this.children_block.current).children(".outcome-outcome").not("ui-draggable"),this.props.objectID,"outcomeoutcome",".outcome-outcome-"+this.props.data.depth,false,false,"#workflow-"+this.props.workflow_id,".outcome");
        if(this.props.data.depth==0)this.makeDroppable();
    }

    sortableMovedFunction(id,new_position,type,new_parent,child_id){
        this.props.renderer.micro_update(moveOutcomeOutcome(id,new_position,new_parent,child_id));
        insertedAt(this.props.renderer,child_id,"outcome",new_parent,"outcome",new_position,"outcomeoutcome");
    }

    stopSortFunction(){
        
    }

    sortableMovedOutFunction(id,new_position,type,new_parent,child_id){
        console.log("you've moved a "+type+" out to another workflow, ignoring");
        // this.props.renderer.micro_update(moveNodeWeek(id,new_position,new_parent,child_id));
        // insertedAt(this.props.renderer,child_id,"node",new_parent,"week",new_position,"nodeweek");
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
export class OutcomeBarOutcomeViewUnconnected extends Component{
    
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
                    <OutcomeTitle data={this.props.data} prefix={this.props.prefix} hovertext={this.props.hovertext}/>
                </div>
                <input class="outcome-toggle-checkbox" type="checkbox" title="Toggle highlighting" onChange={this.clickFunction.bind(this)}/>
                {data.child_outcome_links.length>0 && 
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
        if(this.props.renderer.read_only)return;
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
    
    componentDidMount(){
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
export class SimpleOutcomeViewUnconnected extends EditableComponentWithComments{
    
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
        
        let comments;
        if(this.props.renderer.view_comments)comments=this.addCommenting();
        
        let edit;
        let onClick;
        if(this.props.edit)edit=this.addEditable(data,true);
        onClick=(evt)=>this.props.renderer.selection_manager.changeSelection(evt,this);
        
        
        let css_class="outcome outcome-"+data.id;
        if(this.state.is_dropped)css_class+=" dropped";
        if(data.lock)css_class+=" locked locked-"+data.lock.user_id;
        
        return(
            <div class={css_class} style={this.get_border_style()}
            ref={this.maindiv} onClick={onClick}>
                <div class="outcome-title">
                    <OutcomeTitle data={data} prefix={this.props.prefix} hovertext={this.props.hovertext}/>
                </div>
                {data.child_outcome_links.length>0 && 
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
                <div class="side-actions">
                    <div class="comment-indicator-container"></div>
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

    componentDidMount(){
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

class TableOutcomeBaseUnconnected extends Component{
    render(){
        let outcome_tree = JSON.parse(this.props.outcome_tree);
        return (
            <TableOutcomeView outcomes_type={this.props.outcomes_type} objectID={outcome_tree.id} outcome_tree={outcome_tree} renderer={this.props.renderer}/>
        );
    }
}
//Note here we stringify the outcome tree. Likewise the incoming nodecategory has been stringified.
//This way, this component does NOT rerender every time a change has been made to state, speeding things up.
//If we did not do this, the props would change (even though the derived object is the same, the ref is not),
//and this would trickle down too all the sub-components that use nodecategory.
export const TableOutcomeBase = connect(
    (state,own_props)=>{
        let outcome_tree = Constants.createOutcomeNodeBranch(state,own_props.objectID,JSON.parse(own_props.nodecategory));
        return {outcome_tree:JSON.stringify(outcome_tree),outcomes_type:state.workflow.outcomes_type};
    },
    null
)(TableOutcomeBaseUnconnected)

class TableOutcomeViewUnconnected extends EditableComponentWithComments{
    constructor(props){
        super(props);
        this.objectType="outcome";
    }

    render(){
        let data = this.props.data;
                
        let dropIcon;
        if(data.is_dropped)dropIcon = "droptriangleup";
        else dropIcon = "droptriangledown";
        
        let droptext;
        if(data.is_dropped)droptext=gettext("hide");
        else droptext = gettext("show ")+data.child_outcome_links.length+" "+ngettext("descendant","descendants",data.child_outcome_links.length);

        let comments;
        if(this.props.renderer.view_comments)comments=this.addCommenting();
        
        let outcome_head = (
            <div class="outcome-head" 
                ref={this.maindiv} 
                style={{paddingLeft:data.depth*12}}
                onClick={(evt)=>{this.props.renderer.selection_manager.changeSelection(evt,this)}}
            >
                <div class="outcome-title" style={this.get_border_style()}>
                    <OutcomeTitle data={this.props.data} prefix={this.props.prefix} hovertext={this.props.hovertext}/>
                </div>
                {data.child_outcome_links.length>0 && 
                    <div class="outcome-drop" onClick={this.toggleDrop.bind(this)}>
                        <div class = "outcome-drop-img">
                            <img src={iconpath+dropIcon+".svg"}/>
                        </div>
                        <div class = "outcome-drop-text">
                            {droptext}
                        </div>
                    </div>
                }
                <div class="mouseover-actions">
                    {comments}
                </div>
                <div class="side-actions">
                    <div class="comment-indicator-container"></div>
                </div>
                {this.addEditable(data,true)}
            </div>

        )


        let outcome_row = this.props.outcome_tree.outcomenodes.map(outcomenodegroup=>{
            let group_row = outcomenodegroup.map(outcomenode=>
                    <TableCell outcomes_type={this.props.outcomes_type} renderer={this.props.renderer} nodeID={outcomenode.node_id} degree={outcomenode.degree} outcomeID={this.props.outcome_tree.id}/>
            );
            group_row.push(
                <TableCell outcomes_type={this.props.outcomes_type} renderer={this.props.renderer} total={true} degree={outcomenodegroup.total}/>
            );
            return (
                <div class="table-group">
                    <div class="table-cell blank-cell">
                    </div>
                    {group_row}
                </div>
            );
        });
        outcome_row.push(
            <div class="table-cell blank-cell">
            </div>
        );
        outcome_row.push(
            <TableCell outcomes_type={this.props.outcomes_type} renderer={this.props.renderer} total={true} grand_total={true} degree={this.props.outcome_tree.outcomenodes.total}/>
        );
        let full_row = (
            <div class = "outcome-row">
                {outcome_head}
                <div class="outcome-cells">
                    {outcome_row}
                </div>
            </div>
        );

        let child_rows;
        if(data.is_dropped)child_rows = this.props.outcome_tree.children.map(child=><TableOutcomeView outcomes_type={this.props.outcomes_type} objectID={child.id} outcome_tree={child} renderer={this.props.renderer}/>);
        return [
            full_row,
            child_rows
        ];
    }
}
export const TableOutcomeView = connect(
    mapOutcomeStateToProps,
    null
)(TableOutcomeViewUnconnected)


class TableCell extends React.Component{
    render(){
        let degree=this.props.degree;
        let class_name = "table-cell"
        if(this.props.total) class_name+= " total-cell";
        if(this.props.grand_total)class_name+=" grand-total-cell";

        let checked=false;
        if(degree)checked=true;
        
        let input;
        if(!this.props.renderer.read_only && !this.props.total){
                if(this.props.outcomes_type==0)input=(
                <input type="checkbox" onChange={this.toggleFunction.bind(this)} checked={checked}/>
            );
            else {
                let button_content="+";
                if(degree){
                    if(degree&2)button_content="I";
                    if(degree&4)button_content="D";
                    if(degree&8)button_content="A";
                    if(degree&1)button_content="Y";
                }
                input=(
                    <button onClick={this.clickFunction.bind(this)}>{button_content}</button>
                );
            }
        }

        return (
            <div class={class_name} ref={this.maindiv}>
                {this.getContents(degree, !this.props.total)}
                {input}
            </div>
        );
    }

    toggleFunction(){
        let props = this.props;
        let value;
        if(props.degree)value=0;
        else value=1;
        props.renderer.tiny_loader.startLoad();
        updateOutcomenodeDegree(props.nodeID,props.outcomeID,value,
            (response_data)=>{
                props.renderer.tiny_loader.endLoad();
            }
        );
    }

    clickFunction(){
        let props = this.props;
        let value;
        if(props.data.degree){
            value=props.data.degree << 1;
            if(value>15)value=0;
        }else value=1;
        props.renderer.tiny_loader.startLoad();
        updateOutcomenodeDegree(props.nodeID,props.outcomeID,value,
            (response_data)=>{
                props.renderer.tiny_loader.endLoad();
            }
        );
    }

    getContents(completion_status,self_completion){
        if(completion_status===0){
            return (
                <img src={iconpath+'nocheck.svg'}/>
            );
        }else if(!completion_status){
            return "";
        }
        if(this.props.outcomes_type==0 || completion_status & 1){
            if(self_completion)return(
                <img class="self-completed" src={iconpath+'solid_check.svg'}/>
            );
            else return (
                <img src={iconpath+'check.svg'}/>
            );
        }
        let contents=[];
        if(completion_status & 2){
            let divclass="";
            if(self_completion & 2)divclass=" self-completed";
            contents.push(
                <div class={"outcome-introduced outcome-degree"+divclass}>I</div>
            );
        }
        if(completion_status & 4){
            let divclass="";
            if(self_completion & 4)divclass=" self-completed";
            contents.push(
                <div class={"outcome-developed outcome-degree"+divclass}>D</div>
            );
        }
        if(completion_status & 8){
            let divclass="";
            if(self_completion & 8)divclass=" self-completed";
            contents.push(
                <div class={"outcome-advanced outcome-degree"+divclass}>A</div>
            );
        }
        return contents;
    }
}

//Basic component representing an outcome inside a table
//The component must keep track of both the completion status it receives from descendant outcomes (for each node) and that it gets from its own table cells (also for each node). The completion status it receives from its own table cells is then combined with that it receives from its descendant outcomes to compute whether or not an outcome is achieved in the grand total column.
//To receive updates from the child outcomes, the updateParentCompletion function is passed to the child outcomes. This is called any time a table cell is updated, adding the the node-outcome pair. descendant_completion_status has the format {node_id:{outcome_id:degree}}.
// class TableOutcomeViewUnconnected extends EditableComponentWithComments{
    
//     constructor(props){
//         super(props);
//         this.objectType="outcome";
//         this.children_block = React.createRef();
//         this.state={descendant_completion_status:{}};
//     }
    
//     render(){
//         let data = this.props.data;
        
//         var children = data.child_outcome_links.map((outcomeoutcome)=>
//             <TableOutcomeOutcomeView renderer={this.props.renderer} key={outcomeoutcome} objectID={outcomeoutcome} parentID={data.id} nodecategory={this.props.nodecategory} updateParentCompletion={this.childUpdatedFunction.bind(this)} descendant_completion_status={this.state.descendant_completion_status} outcomes_type={this.props.outcomes_type}/>
//         );

//         let outcomeGroups = this.props.nodecategory.map((nodecategory)=>
//             <TableOutcomeGroup renderer={this.props.renderer} nodes={nodecategory.nodes} outcomeID={this.props.data.id} updateParentCompletion={this.childUpdatedFunction.bind(this)} descendant_completion_status={this.state.descendant_completion_status} outcomes_type={this.props.outcomes_type}/>
                                                                                                 
//         );
                
//         let dropIcon;
//         if(data.is_dropped)dropIcon = "droptriangleup";
//         else dropIcon = "droptriangledown";
        
//         let droptext;
//         if(data.is_dropped)droptext=gettext("hide");
//         else droptext = gettext("show ")+children.length+" "+ngettext("descendant","descendants",children.length);

//         let comments;
//         if(this.props.renderer.view_comments)comments=this.addCommenting();
        
//         return(
//             <div
//             class={
//                 "outcome depth-"+data.depth+((data.is_dropped && " dropped")||"")
//             }>
//                 <div class = "outcome-row">
//                     <div class="outcome-head" 
//                         ref={this.maindiv} 
//                         style={{paddingLeft:data.depth*12}}
//                         onClick={(evt)=>{this.props.renderer.selection_manager.changeSelection(evt,this)}}
//                     >
//                         <div class="outcome-title" style={this.get_border_style()}>
//                             <OutcomeTitle data={this.props.data} titles={this.props.titles} rank={this.props.rank}/>
//                         </div>
//                         {data.child_outcome_links.length>0 && 
//                             <div class="outcome-drop" onClick={this.toggleDrop.bind(this)}>
//                                 <div class = "outcome-drop-img">
//                                     <img src={iconpath+dropIcon+".svg"}/>
//                                 </div>
//                                 <div class = "outcome-drop-text">
//                                     {droptext}
//                                 </div>
//                             </div>
//                         }
//                         <div class="mouseover-actions">
//                             {comments}
//                         </div>
//                         <div class="side-actions">
//                             <div class="comment-indicator-container"></div>
//                         </div>
//                     </div>
//                     <div class="outcome-cells">
//                         {outcomeGroups}
//                         <div class="table-cell blank-cell"></div>
//                         <TableTotalCell grand_total={true} outcomes_type={this.props.outcomes_type} outcomeID={data.id} descendant_completion_status={this.state.descendant_completion_status}/>
//                     </div>
//                 </div>
//                 <div class="children-block" id={this.props.objectID+"-children-block"} ref={this.children_block}>
//                     {children}
//                 </div>
//                 {this.addEditable(data,true)}
//             </div>
            
//         );
//     }
    

//     childUpdatedFunction(node_id,outcome_id,value){
        
//         this.setState((prevState,props)=>{
//             let new_descendant_completion = {...prevState.descendant_completion_status};
//             if(!new_descendant_completion[node_id] && value){
//                 new_descendant_completion[node_id]={};
//                 new_descendant_completion[node_id][outcome_id]=value;
//             }else if(value){
//                 new_descendant_completion[node_id]={...new_descendant_completion[node_id]};
//                 new_descendant_completion[node_id][outcome_id]=value;
//             }else{
//                 new_descendant_completion[node_id]={...new_descendant_completion[node_id]};
//                 delete new_descendant_completion[node_id][outcome_id];
//                 if($.isEmptyObject(new_descendant_completion[node_id]))delete new_descendant_completion[node_id];
//             }
//             return {...prevState,descendant_completion_status:new_descendant_completion};
            
//         });        
//         if(this.props.updateParentCompletion)this.props.updateParentCompletion(node_id,outcome_id,value);
//     }


// }
// export const TableOutcomeView = connect(
//     mapOutcomeStateToProps,
//     null
// )(TableOutcomeViewUnconnected)


/*

Horizontal OutcomeLinking

*/
//Basic component representing an outcome to parent outcome
class OutcomeHorizontalLinkViewUnconnected extends Component{
    
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
                {!this.props.renderer.read_only && <div>
                    {this.addDeleteSelf(data,"close.svg")}
                </div>
                }
                <SimpleOutcomeView renderer={this.props.renderer} checkHidden={this.checkHidden.bind(this)} objectID={data.parent_outcome} parentID={this.props.parentID} throughParentID={data.id}/>
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

    //Adds a button that deletes the item (with a confirmation). The callback function is called after the object is removed from the DOM
    addDeleteSelf(data){
        let icon="close.svg";
        return (
            <ActionButton button_icon={icon} button_class="delete-self-button" titletext={gettext("Delete")} handleClick={this.deleteSelf.bind(this,data)}/>
        );
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

    componentDidMount(){
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
