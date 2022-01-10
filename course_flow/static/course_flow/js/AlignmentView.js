import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON, NodeTitle, TitleText} from "./ComponentJSON";
import * as Constants from "./Constants";
import {getOutcomeByID,getOutcomeOutcomeByID} from "./FindState";
import OutcomeView from "./OutcomeView";
import {SimpleOutcomeView} from "./OutcomeView";
import OutcomeNodeView from "./OutcomeNode";
import {OutcomeTitle} from "./ComponentJSON"

//Analytics view
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
                    <OutcomeTitle data={outcome.data} rank={outcome.rank} titles={outcome.titles}/>
                </div>
            );
        });

        let outcomes_block;
        let terms_block;
        let alignment_block;
        let alignment_reverse_block;

        if(view_buttons.length==0){
            view_buttons="No outcomes have been added yet. Use the Edit Outcomes menu to get started";
        }else{
            outcomes_block=(
                <AlignmentOutcomesBlock workflow_type={data.type} renderer={this.props.renderer} data={this.props.outcomes[this.state.active].data} outcomes_type={data.outcomes_type}/>
            );
//            terms_block=(
//                <AlignmentTermsBlock renderer={this.props.renderer} data={this.props.outcomes[this.state.active].data} outcomes_type={data.outcomes_type}/>
//            );
//            alignment_block=(
//                <AlignmentHorizontalBlock renderer={this.props.renderer} data={this.props.outcomes[this.state.active].data} outcomes_type={data.outcomes_type}/>
//            );
            alignment_reverse_block=(
                <AlignmentHorizontalReverseBlock renderer={this.props.renderer} data={this.props.outcomes[this.state.active].data} outcomes_type={data.outcomes_type}/>
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
                {alignment_reverse_block}
                
            </div>
        );
    }
    
    changeView(index){
        this.setState({active:index});
    }
}
const mapAlignmentStateToProps = state=>({
    data:state.workflow,
    outcomes:state.outcomeworkflow.map(outcomeworkflow=>getOutcomeByID(state,outcomeworkflow.outcome,null,true))
});
export default connect(
    mapAlignmentStateToProps,
    null
)(AlignmentView)
    
class AlignmentOutcomesBlock extends React.Component{
    render(){
        let data = this.props.data;
        let titlestr=Constants.capWords(gettext(this.props.workflow_type+" outcome"));
        return(
            <div class="alignment-block">
                <h3>{titlestr}:</h3>
                <SimpleOutcomeView renderer={this.props.renderer} objectID={data.id}/>
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
                    let node_react = this.props.nodes.filter(node=>node.id==nodeweek.node).map(node=>{
                        let outcomenodes = Constants.getIntersection(node.outcomenode_unique_set,this.props.outcomenode_ids).map(outcomenode=>
                            <OutcomeNodeView objectID={outcomenode}/>
                        );

                        return (
                            <div style={{backgroundColor:this.props.renderer.column_colours[node.column]}} class={"node column-"+node.column}>
                                <div class="node-top-row">
                                    <NodeTitle data={data}/>
                                    <div class="outcomenode-block">
                                        {outcomenodes}
                                    </div>
                                </div>
                                <div class="node-drop-row"></div>
                            </div>
                        );
                    });
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
    let children = outcome.child_outcome_links.map(id=>getOutcomeOutcomeByID(state,id)).map(outcomeoutcome=>getOutcomeByID(state,outcomeoutcome.data.child).data);
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
        
        
        let parent_outcomes = this.props.outcomes.map(obj=>{
            
            let child_outcomes = [];
            for(let i=0;i<obj.child_outcomes.length;i++){
                let node_title_text;
                if(!obj.nodes[i] || !obj.outcomenodes[i])continue;
                
                child_outcomes.push(
                    <div class="alignment-row">
                        {Constants.getCompletionImg(obj.outcomenodes[i].degree,this.props.outcomes_type)}
                        <NodeTitle data={obj.nodes[i]}/>
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


class AlignmentHorizontalReverseBlockUnconnected extends React.Component{
    render(){
        let data = this.props.data;
        let weekworkflows = this.props.weekworkflows.map(weekworkflow=>{
            let week = weekworkflow.week;
            let week_rank=weekworkflow.rank;
            
            let nodeweeks = weekworkflow.nodes.map((obj,k)=>{
                let node = obj.node;
                let nodeweek = weekworkflow.nodeweeks[k];

                let child_outcomes = obj.child_outcomes.map((child_outcome,i)=>{

                    let parent_outcomes = obj.parent_outcomes[i].parent_outcomes.map((parent_outcome,j)=>
                        <div class="alignment-row">
                            {Constants.getCompletionImg(obj.parent_outcomes[i].outcomenodes[j].degree,this.props.outcomes_type)}
                            <SimpleOutcomeView objectID={parent_outcome.id} comments={true} edit={true} renderer={this.props.renderer}/>
                        </div>
                    );
                    console.log("Printing out the parent outcomes");
                    console.log(parent_outcomes);

                    if(parent_outcomes.length==0)return null;

                    return (
                        <div class="child-outcome">
                            <div class="half-width alignment-column">
                                <SimpleOutcomeView get_alternate="child" objectID={child_outcome.id} comments={true} edit={true} renderer={this.props.renderer}/>
                            </div>
                            <div class="half-width alignment-column">
                                {parent_outcomes}
                            </div>
                        </div>
                    );

                });

                return (
                    <div class="node-week">
                        <div style={{backgroundColor:this.props.renderer.column_colours[node.column]}} class={"node column-"+node.column}>
                            <div class="node-top-row">
                                <NodeTitle data={node}/>
                            </div>
                            <div class="outcome-block">
                                {child_outcomes}
                            </div>
                            <div class="node-drop-row"></div>
                        </div>
                    </div>
                )
            });
        
            let default_text = week.week_type_display+" "+(week_rank+1);
        
            return(
                <div class="week-workflow">
                    <div class="week">
                        <TitleText text={week.title} defaultText={default_text}/>
                        <div class="node-block">
                            {nodeweeks}
                        </div>
                    </div>
                </div>
            );
        });
        
        return(
            <div class="alignment-block">
                <h3>Alignment:</h3>
                {weekworkflows}
            </div>
        );
    }
    
    
    
}
const mapAlignmentHorizontalReverseStateToProps = (state,own_props)=>{
    let outcome = own_props.data;
    let all_outcome_ids = [outcome.id];
    getDescendantOutcomes(state,outcome,all_outcome_ids);
    let all_outcomes = state.outcome.filter(outcome=>all_outcome_ids.includes(outcome.id));
    
    let node_ids = state.outcomenode.filter(outcomenode=>all_outcome_ids.includes(outcomenode.outcome)).map(outcomenode=>outcomenode.node);
    let nodes = state.node.filter(node=>node_ids.includes(node.id)).map(node=>{
        let child_outcomes=[];
        let parent_outcomes=[];
        if(node.linked_workflow){
            let child_outcome_ids = [];
            for(let i=0;i<state.child_workflow.length;i++){
                if(state.child_workflow[i].id==node.linked_workflow){
                    child_outcome_ids=state.child_workflow[i].outcomeworkflow_set.map(outcomeworkflow_id=>{
                        for(let j=0;j<state.child_outcomeworkflow.length;j++){
                            if(state.child_outcomeworkflow[j].id==outcomeworkflow_id)return state.child_outcomeworkflow[j].outcome;
                        }
                        return null;
                    })
                    break;
                
                }
            }
            
            child_outcomes = Constants.filterThenSortByID(state.child_outcome,child_outcome_ids);
            parent_outcomes = child_outcomes.map(child_outcome=>{
                let horizontallinks = Constants.filterThenSortByID(state.outcomehorizontallink,child_outcome.outcome_horizontal_links_unique);
                let my_parent_outcomes=horizontallinks.map(link=>{
                    for(let i=0;i<all_outcomes.length;i++){
                        if(all_outcomes[i].id==link.parent_outcome)return all_outcomes[i];
                    }
                    return null;
                });
                my_parent_outcomes=my_parent_outcomes.filter(parent_outcome=>parent_outcome!==null);
                let my_outcomenodes = my_parent_outcomes.map(parent_outcome=>{
                    for(let i=0;i<state.outcomenode.length;i++){
                        if(state.outcomenode[i].outcome==parent_outcome.id && state.outcomenode[i].node==node.id)return state.outcomenode[i];
                    } 
                    return null;
                });
                
                return {parent_outcomes:my_parent_outcomes,outcomenodes:my_outcomenodes};
            });
        }
        
        return {node:node,child_outcomes:child_outcomes,parent_outcomes:parent_outcomes}
    })
    
    let nodeweeks = state.nodeweek.filter(nodeweek=>node_ids.includes(nodeweek.node));
    let week_ids = nodeweeks.map(nodeweek=>nodeweek.week);
    let weekworkflows = state.weekworkflow.filter(weekworkflow=>week_ids.includes(weekworkflow.week)).sort((a,b)=>state.workflow.weekworkflow_set.indexOf(a.id)-state.workflow.weekworkflow_set.indexOf(b.id)).map(weekworkflow=>{
        let week;
        for(let i=0;i<state.week.length;i++){
            if(weekworkflow.week==state.week[i].id)week=state.week[i];
        }
        if(!week)return null;
        let nodeweeks_included = Constants.filterThenSortByID(nodeweeks,week.nodeweek_set);
        let nodes_included = nodeweeks_included.map(nodeweek=>{
            for(let i=0;i<nodes.length;i++){
                if(nodes[i].node.id==nodeweek.node){
                    return {...nodes[i]};
                }
            }
            return null;
            
        });
        
        return {weekworkflow:weekworkflow,rank:state.workflow.weekworkflow_set.indexOf(weekworkflow.id),week:week,nodeweeks:nodeweeks_included,nodes:nodes_included}
    });
    
    return {weekworkflows:weekworkflows};
    
}
export const AlignmentHorizontalReverseBlock = connect(
    mapAlignmentHorizontalReverseStateToProps,
    null
)(AlignmentHorizontalReverseBlockUnconnected)

