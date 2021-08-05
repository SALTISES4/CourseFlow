import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON, TitleText} from "./ComponentJSON";
import * as Constants from "./Constants";
import {getOutcomeByID,getOutcomeOutcomeByID} from "./FindState";
import OutcomeView from "./OutcomeView";
import OutcomeNodeView from "./OutcomeNode";

//Basic component representing an outcome
class AlignmentView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="workflow";
        this.state={active:0};
    }
    
    render(){
        let data = this.props.data;
        let view_buttons = this.props.outcomes.map((outcome,i)=>{
            let view_class = "hover-shade";
            if(i==this.state.active)view_class+=" active";
            return(
                <div id={"button_"+outcome.data.id} class={view_class} onClick={this.changeView.bind(this,i)}>
                    {outcome.data.title}
                </div>
            );
        });

        let outcomes_block;
        let terms_block;
        let alignment_block;

        if(view_buttons.length==0){
            view_buttons="No outcomes have been added yet. Use the Edit Outcomes menu to get started";
        }else{
            outcomes_block=(
                <AlignmentOutcomesBlock renderer={this.props.renderer} data={this.props.outcomes[this.state.active].data}/>
            );
            terms_block=(
                <AlignmentTermsBlock renderer={this.props.renderer} data={this.props.outcomes[this.state.active].data}/>
            );
            alignment_block=(
                <AlignmentHorizontalBlock renderer={this.props.renderer} data={this.props.outcomes[this.state.active].data}/>
            );
        }
    
        return(
            <div class="workflow-details">
                <div class="workflow-view-select">
                    {view_buttons}
                </div>
                {outcomes_block}
                {terms_block}
                {alignment_block}
                
            </div>
        );
    }
    
    changeView(index){
        this.setState({active:index});
    }
}
const mapAlignmentStateToProps = state=>({
    data:state.workflow,
    outcomes:state.outcomeworkflow.map(outcomeworkflow=>getOutcomeByID(state,outcomeworkflow.outcome,true))
});
export default connect(
    mapAlignmentStateToProps,
    null
)(AlignmentView)
    
class AlignmentOutcomesBlock extends React.Component{
    render(){
        let data = this.props.data;
        return(
            <div class="alignment-block">
                <h3>Outcome:</h3>
                <OutcomeView renderer={this.props.renderer} objectID={data.id}/>
            </div>
        );
    }
    
}   
class AlignmentTermsBlockUnconnected extends React.Component{
    render(){
        let data = this.props.data;
        
        let weekworkflows = Constants.filterThenSortByID(this.props.weekworkflows,this.props.workflow.weekworkflow_set).map(weekworkflow=>{
            let week_rank = this.props.workflow.weekworkflow_set.indexOf(weekworkflow.id);
            let week_react = this.props.weeks.filter(week=>week.id==weekworkflow.week).map(week=>{

                let nodeweek_ids = Constants.getIntersection(week.nodeweek_set,this.props.nodeweek_ids);
                let nodeweeks = Constants.filterThenSortByID(this.props.nodeweeks,nodeweek_ids).map(nodeweek=>{
                    console.log("nodes");
                    console.log(this.props.nodes);
                    console.log(nodeweek.node);
                    console.log(this.props.nodes.filter(node=>node.id==nodeweek.node));
                    let node_react = this.props.nodes.filter(node=>node.id==nodeweek.node).map(node=>{
                        console.log("outcomenodes");
                        console.log(node.outcomenode_unique_set);
                        console.log(this.props.outcomenode_ids);
                        let titleText = node.title;
                        if(node.represents_workflow)titleText = node.linked_workflow_title;
                        console.log(Constants.getIntersection(node.outcomenode_unique_set,this.props.outcomenode_ids));
                        let outcomenodes = Constants.getIntersection(node.outcomenode_unique_set,this.props.outcomenode_ids).map(outcomenode=>
                            <OutcomeNodeView objectID={outcomenode}/>
                        );

                        return (
                            <div style={{backgroundColor:this.props.renderer.column_colours[node.column]}} class={"node column-"+node.column}>
                                <div class="node-top-row">
                                    <div class="node-title">
                                        <TitleText text={titleText} defaultText="Unnamed"/>
                                    </div>
                                    <div class="outcomenode-block">
                                        {outcomenodes}
                                    </div>
                                </div>
                                <div class="node-drop-row"></div>
                            </div>
                        );
                    });
                    console.log("node_react");
                    console.log(node_react);
                    return(
                        <div class="node-week">{node_react}</div>
                    );
                });
                let default_text = week.week_type_display+" "+(week_rank+1);

                return (
                    <div class="week">
                        <TitleText text={week.title} defaultText={default_text}/>
                        <div class="node-block">
                            {nodeweeks}
                        </div>
                    </div>
                )
            })
            
            return(
                <div class="week-workflow">
                    {week_react}
                </div>
            )
        })
        
        
        
        return(
            <div class="alignment-block">
                <h3>Usage:</h3>
                {weekworkflows}
            </div>
        );
    }
    
}   
const getDescendantOutcomes = (state,outcome,outcomes)=>{
    console.log(outcome.child_outcome_links.map(id=>getOutcomeOutcomeByID(state,id)));
    let children = outcome.child_outcome_links.map(id=>getOutcomeOutcomeByID(state,id)).map(outcomeoutcome=>getOutcomeByID(state,outcomeoutcome.data.child).data);
    console.log(children);
    for(let i=0;i<children.length;i++){
        outcomes.push(children[i].id);
        getDescendantOutcomes(state,children[i],outcomes);
    }
}
const mapAlignmentTermStateToProps = (state,own_props)=>{
    let outcome = own_props.data;
    let all_outcomes = [outcome.id];
    getDescendantOutcomes(state,outcome,all_outcomes);
    let outcomenodes = state.outcomenode.filter(outcomenode=>all_outcomes.includes(outcomenode.outcome));
    let outcomenode_ids = outcomenodes.map(outcomenode=>outcomenode.id);
    let node_ids = outcomenodes.map(outcomenode=>outcomenode.node);
    let nodes = state.node.filter(node=>node_ids.includes(node.id));
    let nodeweeks = state.nodeweek.filter(nodeweek=>node_ids.includes(nodeweek.node));
    let nodeweek_ids = nodeweeks.map(nodeweek=>nodeweek.id);
    let week_ids = nodeweeks.map(nodeweek=>nodeweek.week);
    let weeks = state.week.filter(week=>week_ids.includes(week.id));
    let weekworkflows = state.weekworkflow.filter(weekworkflow=>week_ids.includes(weekworkflow.week));
    
    return {workflow:state.workflow,weekworkflows:weekworkflows,weeks:weeks,nodeweek_ids:nodeweek_ids,nodeweeks:nodeweeks,nodes:nodes,node_ids:node_ids,outcomenodes:outcomenodes,outcomenode_ids:outcomenode_ids,all_outcomes:all_outcomes};
    
}
export const AlignmentTermsBlock = connect(
    mapAlignmentTermStateToProps,
    null
)(AlignmentTermsBlockUnconnected)

class AlignmentHorizontalBlockUnconnected extends React.Component{
    render(){
        let data = this.props.data;
        console.log("alignment horizontal block");
        console.log(this.props);
        
        
        let parent_outcomes = this.props.outcomes.map(obj=>{
            
            let child_outcomes = [];
            for(let i=0;i<obj.child_outcomes.length;i++){
                let node_title_text;
                if(!obj.nodes[i] || !obj.outcomenodes[i])continue;
                if(obj.nodes[i].represents_workflow){
                    node_title_text=obj.nodes[i].linked_workflow_title;
                }
                else node_title_text = obj.nodes[i].title;
                
                child_outcomes.push(
                    <div class="alignment-row">
                        {this.getContents(obj.outcomenodes[i].degree)}
                        <TitleText text={node_title_text} default_text="Unnamed"/>
                        <TitleText text={obj.child_outcomes[i].title} default_text="Unnamed"/>
                    </div>
                )
            }
            
            return (
                <div class="outcome-alignment">
                    <div class="parent-outcome-box">
                        <TitleText text={obj.parent_outcome.title} default_text="Unnamed"/>
                    </div>
                    <div class="child-outcome-box">
                        {child_outcomes}
                    </div>
                </div>
            )
        });
        
        
        
        return(
            <div class="alignment-block">
                <h3>Alignment:</h3>
                {parent_outcomes}
            </div>
        );
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
const mapAlignmentHorizontalStateToProps = (state,own_props)=>{
    let outcome = own_props.data;
    let all_outcome_ids = [outcome.id];
    getDescendantOutcomes(state,outcome,all_outcome_ids);
    let all_outcomes = state.outcome.filter(outcome=>all_outcome_ids.includes(outcome.id));
    
    let outcomes = all_outcomes.map(parent_outcome=>{
        let outcomehorizontallinks = state.outcomehorizontallink.filter(link=>parent_outcome.id==link.parent_outcome);
        let child_outcomes = outcomehorizontallinks.map(link=>{
            for(let i=0;i<state.child_outcome.length;i++){
                if(state.child_outcome[i].id==link.outcome)return state.child_outcome[i];
            }
            return null;
        });
        let nodes = child_outcomes.map(child_outcome=>{
            if(!child_outcome)return null;
            let workflow_id=null;
            for(let i=0;i<state.child_outcomeworkflow.length;i++){
                if(state.child_outcomeworkflow[i].outcome==child_outcome.id){
                    workflow_id=state.child_outcomeworkflow[i].workflow;
                    break;
                }
            }
            if(workflow_id===null)return;
            for(let i=0;i<state.node.length;i++){
                if(state.node[i].linked_workflow==workflow_id)return state.node[i];
            }
            return null;
        });
        let outcomenodes = nodes.map(node=>{
            if(!node)return null;
            for(let i=0;i<state.outcomenode.length;i++){
                if(state.outcomenode[i].node==node.id && state.outcomenode[i].outcome==parent_outcome.id)return state.outcomenode[i];
            }
            return null; 
        });
        
        return {parent_outcome:parent_outcome,child_outcomes:child_outcomes,nodes:nodes,outcomenodes:outcomenodes}; 
    });
    
    
    return {outcomes:outcomes};
    
}
export const AlignmentHorizontalBlock = connect(
    mapAlignmentHorizontalStateToProps,
    null
)(AlignmentHorizontalBlockUnconnected)


