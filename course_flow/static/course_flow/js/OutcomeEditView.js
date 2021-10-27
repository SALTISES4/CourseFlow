import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON, OutcomeTitle} from "./ComponentJSON";
import OutcomeWorkflowView from "./OutcomeWorkflowView";
import {OutcomeBarOutcomeView, OutcomeBarOutcomeViewUnconnected} from "./OutcomeView";
import OutcomeView from "./OutcomeView";
import {getParentWorkflowByID,getParentOutcomeNodeByID, getOutcomeByID, getOutcomeOutcomeByID} from "./FindState";
import {WorkflowForMenu, renderMessageBox, closeMessageBox} from './MenuComponents';
import {newOutcome} from "./PostFunctions";
import * as Constants from "./Constants";

//Basic component representing the outcome view
class OutcomeEditView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="workflow";
    }
    
    render(){
        let data = this.props.data;
        var selector = this;
        
        let outcomes = data.outcomeworkflow_set.map(outcomeworkflow=>
            <OutcomeWorkflowView objectID={outcomeworkflow} parentID={data.id} renderer={this.props.renderer}/>
        );
        if(outcomes.length==0)outcomes=(
            <div class="emptytext">{gettext("Here you can add and edit outcomes for the current workflow. They will then be available in the Workflow view to tag nodes in the Outcomes tab of the sidebar.")}</div>
        )
        let titlestr = Constants.capWords(gettext(data.type+" outcomes"));
        
        return(
            <div class="workflow-details">
                <div class="outcome-edit">
                    <h4>{titlestr}</h4>
                    {outcomes}
                    <div id="add-new-outcome" class="menu-create hover-shade" onClick={this.addNew.bind(this)}>
                        <img class="create-button" src={iconpath+"add_new_white.svg"}/>
                        <div>Add new</div>
                    </div>
                    <ParentOutcomeBar/>
                </div>
            </div>
        );
    }
    
    
    addNew(){
        newOutcome(this.props.data.id);
    }
    
}
const mapWorkflowStateToProps = state=>({
    data:state.workflow
})
export default connect(
    mapWorkflowStateToProps,
    null
)(OutcomeEditView)


class ParentOutcomeNodeViewUnconnected extends ComponentJSON{
    render(){
        let data = this.props.data;
        
        return(
            <div class="parent-outcome-node">
                {this.getContents(data.degree)}
                <ParentOutcomeView objectID={data.outcome} renderer={this.props.renderer}/>
            </div>
        )
        
    }
    
    getContents(completion_status){
        if(this.props.outcomes_type==0 || completion_status & 1){
            return (
                <img class="self-completed" src={iconpath+'solid_check.svg'}/>
            )
        }
        let contents=[];
        if(completion_status & 2){
            let divclass="";
            contents.push(
                <div class={"outcome-introduced outcome-degree"+divclass}>I</div>
            );
        }
        if(completion_status & 4){
            let divclass="";
            contents.push(
                <div class={"outcome-developed outcome-degree"+divclass}>D</div>
            );
        }
        if(completion_status & 8){
            let divclass="";
            contents.push(
                <div class={"outcome-advanced outcome-degree"+divclass}>A</div>
            );
        }
        return contents;
        
    }
}
const mapParentOutcomeNodeStateToProps = (state,own_props)=>(
    getParentOutcomeNodeByID(state,own_props.objectID)
)
export const ParentOutcomeNodeView = connect(
    mapParentOutcomeNodeStateToProps,
    null
)(ParentOutcomeNodeViewUnconnected)


class ParentOutcomeViewUnconnected extends OutcomeBarOutcomeViewUnconnected{
    render(){
        let data = this.props.data;
        let children = data.child_outcome_links.map((outcomeoutcome)=>
            <ParentOutcomeOutcomeView key={outcomeoutcome} objectID={outcomeoutcome} parentID={data.id} renderer={this.props.renderer} />
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
                <div class="outcome-title">
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
        )
    }
    
    
}
const mapParentOutcomeStateToProps = (state,own_props)=>(
    getOutcomeByID(state,own_props.objectID,"parent")
)
export const ParentOutcomeView = connect(
    mapParentOutcomeStateToProps,
    null
)(ParentOutcomeViewUnconnected)

class ParentOutcomeOutcomeViewUnconnected extends ComponentJSON{
    render(){
        let data = this.props.data;
        
        return (
            <div class="outcome-outcome" id={data.id} ref={this.maindiv}>
                <ParentOutcomeView objectID={data.child} parentID={this.props.parentID} throughParentID={data.id}/>
            </div>
        );
    }
}
const mapParentOutcomeOutcomeStateToProps = (state,own_props)=>(
    getOutcomeOutcomeByID(state,own_props.objectID,"parent")
)
export const ParentOutcomeOutcomeView = connect(
    mapParentOutcomeOutcomeStateToProps,
    null
)(ParentOutcomeOutcomeViewUnconnected)





class OutcomeBarUnconnected extends ComponentJSON{
    render(){
        let data = this.props.data;
        var outcomebaroutcomes = data.map((outcome)=>
            <OutcomeBarOutcomeView key={outcome.outcome} objectID={outcome.outcome}/>
        );
        
        if(outcomebaroutcomes.length==0){
            outcomebaroutcomes=gettext("Add outcomes to this workflow in by clicking the button below.");
        }
        
        let edittext=Constants.capWords(gettext("Edit")+" "+gettext(this.props.workflow_type+" outcomes"));
        let titlestr=Constants.capWords(gettext(this.props.workflow_type+" outcomes"));
        return reactDom.createPortal(
            <div id="outcome-bar-workflow" class="right-panel-inner">
                <h4 class="drag-and-drop">{titlestr}:</h4>
                <div class="outcome-bar-outcome-block">
                    {outcomebaroutcomes}
                </div>
                {!read_only &&
                    <button class="menu-create" id="edit-outcomes-button" onClick={this.editOutcomesClick.bind(this)}>{edittext}</button>
                }
            </div>
        ,$("#outcome-bar")[0]);
    }
    
    editOutcomesClick(){
        this.props.renderer.render($("#container"),"outcomeedit");
    }
    
}
const mapOutcomeBarStateToProps = state =>(
    {data:state.outcomeworkflow,workflow_type:state.workflow.type}
)
export const OutcomeBar = connect(
    mapOutcomeBarStateToProps,
    null
)(OutcomeBarUnconnected)


class ParentOutcomeBarUnconnected extends ComponentJSON{
    render(){
        let data = this.props.data;
        var outcomebaroutcomes = data.map((node)=>node.outcomenode_unique_set.map(outcomenode=>
            <ParentOutcomeNodeView key={outcomenode} objectID={outcomenode}/>
        ));
        
        if(outcomebaroutcomes.length==0){
            outcomebaroutcomes=gettext("Here you can find outcomes from the workflows that contain a node linked to this workflow. This allows you to create relationships between the outcomes at different levels (ex. program to course), called 'alignment'. Link this workflow to a node in another to do so.");
        }
        
        let titlestr=gettext("Assigned")+" "+Constants.capWords(gettext(this.props.workflow_type+" outcomes"));
        
        return reactDom.createPortal(
            <div id="outcome-bar-workflow" class="right-panel-inner">
                <h4 class="drag-and-drop">{titlestr}</h4>
                <div class="outcome-bar-outcome-block">
                    {outcomebaroutcomes}
                </div>
            </div>
        ,$("#outcome-bar")[0]);
    }
    
}
const mapParentOutcomeBarStateToProps = state =>{
    return {data:state.parent_node,workflow_type:Constants.parent_workflow_type[state.workflow.type]}
}
export const ParentOutcomeBar = connect(
    mapParentOutcomeBarStateToProps,
    null
)(ParentOutcomeBarUnconnected)