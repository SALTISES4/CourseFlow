import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON, NodeTitle, TitleText, OutcomeTitle, getOutcomeTitle, WeekTitle} from "./ComponentJSON";
import * as Constants from "./Constants";
import {getOutcomeByID,getOutcomeOutcomeByID, getChildWorkflowByID, getWeekByID, getSortedOutcomesFromOutcomeWorkflowSet} from "./FindState";
import OutcomeView from "./OutcomeView";
import {SimpleOutcomeView} from "./OutcomeView";
import OutcomeNodeView from "./OutcomeNode";
import {newOutcome, updateOutcomenodeDegree, updateOutcomehorizontallinkDegree} from "./PostFunctions"

//Analytics view
class AlignmentView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="workflow";
        this.state={active:0,active2:0,sort:"outcome"};
    }
    
    render(){
        let data = this.props.data;
        let view_buttons_outcomes = this.props.outcomes.map((category,i)=>{
            return([
                <h4>{category.objectset.title}:</h4>,
                <div class="workflow-view-select hide-print">
                    {category.outcomes.map((outcome,j)=>{
                        let view_class = "hover-shade";
                        if(this.state.sort=="outcome" && i==this.state.active && j==this.state.active2)view_class+=" active";
                        return(
                            <div id={"button-outcome-"+outcome.data.id} class={view_class} onClick={this.changeView.bind(this,i,"outcome",j)}>
                                <OutcomeTitle data={outcome.data} rank={outcome.rank} titles={outcome.titles}/>
                            </div>
                        );
                    })}
                </div>
            ])
        });
        let view_buttons_terms = this.props.terms.map((week,i)=>{
            let view_class = "hover-shade";
            if(this.state.sort=="week" && i==this.state.active)view_class+=" active";
            return(
                <div id={"button-week-"+week.id} class={view_class} onClick={this.changeView.bind(this,i,"week")}>
                    <WeekTitle data={week} rank={i}/>
                </div>
            );
        });

        let outcomes_block;
        let terms_block;
        let alignment_block;
        let alignment_reverse_block;

        let outcome_data;
        if(this.state.sort=="outcome"){
            let found=false;
            try{
                outcome_data = this.props.outcomes[this.state.active].outcomes[this.state.active2].data;
            }catch(err){
                for(var i=0;i<this.props.outcomes.length;i++){
                    if(this.props.outcomes[i].outcomes.length>=1){
                        this.changeView(i,"outcome",0);
                        return null;
                    }
                }
                if(this.state.active!=-1||this.state.active2!=0){
                    this.changeView(-1,"outcome",0);
                    return null;
                }
            }
        }


        if(this.state.active==-1){
            view_buttons_outcomes=gettext("No outcomes have been added yet. Use the Edit Outcomes menu to get started");
        }else if(this.state.sort=="outcome"){
            outcomes_block=(
                <AlignmentOutcomesBlock workflow_type={data.type} renderer={this.props.renderer} data={outcome_data} outcomes_type={data.outcomes_type}/>
            );
            alignment_reverse_block=(
                <AlignmentHorizontalReverseBlock sort="outcome" renderer={this.props.renderer} data={outcome_data} outcomes_type={data.outcomes_type}/>
            );
        }

        if(this.state.sort=="week"){
            alignment_reverse_block=(
                <AlignmentHorizontalReverseBlock sort="week" renderer={this.props.renderer} data={this.props.terms[this.state.active]} base_outcomes={this.props.outcomes} outcomes_type={data.outcomes_type}/>
            )
        }
    
        return(
            <div class="workflow-details">
                <h3>{gettext("Filters")}:</h3>
                {view_buttons_outcomes}
                <h4>{gettext("Sections")}:</h4>
                <div class="workflow-view-select hide-print">
                    {view_buttons_terms}
                </div>
                {outcomes_block}
                {terms_block}
                {alignment_block}
                {alignment_reverse_block}
                
            </div>
        );
    }
    
    changeView(index, sort, index2=0){
        this.setState({active:index,sort:sort,active2:index2});
    }

}
const mapAlignmentStateToProps = state=>{
    let outcomes = getSortedOutcomesFromOutcomeWorkflowSet(state,state.workflow.outcomeworkflow_set).map(category=>
        ({...category,outcomes:category.outcomes.map(outcome=>getOutcomeByID(state,outcome.id))})
    );
    return {
        data:state.workflow,
        outcomes:outcomes,
        terms:Constants.filterThenSortByID(state.weekworkflow,state.workflow.weekworkflow_set).map(wwf=>getWeekByID(state,wwf.week).data)
    }
};
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
                <OutcomeView renderer={this.props.renderer} objectID={data.id}/>
            </div>
        );
    }
    
}   
//class AlignmentTermsBlockUnconnected extends React.Component{
//    render(){
//        let data = this.props.data;
//        
//        let weekworkflows = Constants.filterThenSortByID(this.props.weekworkflows,this.props.workflow.weekworkflow_set).map(weekworkflow=>{
//            let week_rank = this.props.workflow.weekworkflow_set.indexOf(weekworkflow.id);
//            let week_react = this.props.weeks.filter(week=>week.id==weekworkflow.week).map(week=>{
//
//                let nodeweek_ids = Constants.getIntersection(week.nodeweek_set,this.props.nodeweek_ids);
//                let nodeweeks = Constants.filterThenSortByID(this.props.nodeweeks,nodeweek_ids).map(nodeweek=>{
//                    let node_react = this.props.nodes.filter(node=>node.id==nodeweek.node).map(node=>{
//                        let outcomenodes = Constants.getIntersection(node.outcomenode_unique_set,this.props.outcomenode_ids).map(outcomenode=>
//                            <OutcomeNodeView objectID={outcomenode}/>
//                        );
//
//                        return (
//                            <div style={{backgroundColor:this.props.renderer.column_colours[node.column]}} class={"node column-"+node.column}>
//                                <div class="node-top-row">
//                                    <NodeTitle data={data}/>
//                                    <div class="outcomenode-block">
//                                        {outcomenodes}
//                                    </div>
//                                </div>
//                                <div class="node-drop-row"></div>
//                            </div>
//                        );
//                    });
//                    return(
//                        <div class="node-week">{node_react}</div>
//                    );
//                });
//                let default_text = week.week_type_display+" "+(week_rank+1);
//
//                return (
//                    <div class="week">
//                        <TitleText text={week.title} defaultText={default_text}/>
//                        <div class="node-block">
//                            {nodeweeks}
//                        </div>
//                    </div>
//                )
//            })
//            
//            return(
//                <div class="week-workflow">
//                    {week_react}
//                </div>
//            )
//        })
//        
//        
//        
//        return(
//            <div class="alignment-block">
//                <h3>Usage:</h3>
//                {weekworkflows}
//            </div>
//        );
//    }
//    
//}   
const getDescendantOutcomes = (state,outcome,outcomes)=>{
    let children = outcome.child_outcome_links.map(id=>getOutcomeOutcomeByID(state,id)).map(outcomeoutcome=>getOutcomeByID(state,outcomeoutcome.data.child).data);
    for(let i=0;i<children.length;i++){
        outcomes.push(children[i].id);
        getDescendantOutcomes(state,children[i],outcomes);
    }
}
//const mapAlignmentTermStateToProps = (state,own_props)=>{
//    let outcome = own_props.data;
//    let all_outcomes = [outcome.id];
//    getDescendantOutcomes(state,outcome,all_outcomes);
//    let outcomenodes = state.outcomenode.filter(outcomenode=>all_outcomes.includes(outcomenode.outcome));
//    let outcomenode_ids = outcomenodes.map(outcomenode=>outcomenode.id);
//    let node_ids = outcomenodes.map(outcomenode=>outcomenode.node);
//    let nodes = state.node.filter(node=>node_ids.includes(node.id));
//    let nodeweeks = state.nodeweek.filter(nodeweek=>node_ids.includes(nodeweek.node));
//    let nodeweek_ids = nodeweeks.map(nodeweek=>nodeweek.id);
//    let week_ids = nodeweeks.map(nodeweek=>nodeweek.week);
//    let weeks = state.week.filter(week=>week_ids.includes(week.id));
//    let weekworkflows = state.weekworkflow.filter(weekworkflow=>week_ids.includes(weekworkflow.week));
//    
//    return {workflow:state.workflow,weekworkflows:weekworkflows,weeks:weeks,nodeweek_ids:nodeweek_ids,nodeweeks:nodeweeks,nodes:nodes,node_ids:node_ids,outcomenodes:outcomenodes,outcomenode_ids:outcomenode_ids,all_outcomes:all_outcomes};
//    
//}
//export const AlignmentTermsBlock = connect(
//    mapAlignmentTermStateToProps,
//    null
//)(AlignmentTermsBlockUnconnected)
//
//class AlignmentHorizontalBlockUnconnected extends React.Component{
//    render(){
//        let data = this.props.data;
//        
//        
//        let parent_outcomes = this.props.outcomes.map(obj=>{
//            
//            let child_outcomes = [];
//            for(let i=0;i<obj.child_outcomes.length;i++){
//                let node_title_text;
//                if(!obj.nodes[i] || !obj.outcomenodes[i])continue;
//                
//                child_outcomes.push(
//                    <div class="alignment-row">
//                        {Constants.getCompletionImg(obj.outcomenodes[i].degree,this.props.outcomes_type)}
//                        <NodeTitle data={obj.nodes[i]}/>
//                        <TitleText text={obj.child_outcomes[i].title} default_text="Unnamed"/>
//                    </div>
//                )
//            }
//            
//            return (
//                <div class="outcome-alignment">
//                    <div class="parent-outcome-box">
//                        <TitleText text={obj.parent_outcome.title} default_text="Unnamed"/>
//                    </div>
//                    <div class="child-outcome-box">
//                        {child_outcomes}
//                    </div>
//                </div>
//            )
//        });
//        
//        
//        
//        return(
//            <div class="alignment-block">
//                <h3>Alignment:</h3>
//                {parent_outcomes}
//            </div>
//        );
//    }
//    
//}
//const mapAlignmentHorizontalStateToProps = (state,own_props)=>{
//    let outcome = own_props.data;
//    let all_outcome_ids = [outcome.id];
//    getDescendantOutcomes(state,outcome,all_outcome_ids);
//    let all_outcomes = state.outcome.filter(outcome=>all_outcome_ids.includes(outcome.id));
//    
//    let outcomes = all_outcomes.map(parent_outcome=>{
//        let outcomehorizontallinks = state.outcomehorizontallink.filter(link=>parent_outcome.id==link.parent_outcome);
//        let child_outcomes = outcomehorizontallinks.map(link=>{
//            for(let i=0;i<state.outcome.length;i++){
//                if(state.outcome[i].id==link.outcome)return state.outcome[i];
//            }
//            return null;
//        });
//        let nodes = child_outcomes.map(child_outcome=>{
//            if(!child_outcome)return null;
//            let workflow_id=null;
//            for(let i=0;i<state.outcomeworkflow.length;i++){
//                if(state.outcomeworkflow[i].outcome==child_outcome.id){
//                    workflow_id=state.outcomeworkflow[i].workflow;
//                    break;
//                }
//            }
//            if(workflow_id===null)return;
//            for(let i=0;i<state.node.length;i++){
//                if(state.node[i].linked_workflow==workflow_id)return state.node[i];
//            }
//            return null;
//        });
//        let outcomenodes = nodes.map(node=>{
//            if(!node)return null;
//            for(let i=0;i<state.outcomenode.length;i++){
//                if(state.outcomenode[i].node==node.id && state.outcomenode[i].outcome==parent_outcome.id)return state.outcomenode[i];
//            }
//            return null; 
//        });
//        
//        return {parent_outcome:parent_outcome,child_outcomes:child_outcomes,nodes:nodes,outcomenodes:outcomenodes}; 
//    });
//    
//    
//    return {outcomes:outcomes};
//    
//}
//export const AlignmentHorizontalBlock = connect(
//    mapAlignmentHorizontalStateToProps,
//    null
//)(AlignmentHorizontalBlockUnconnected)




class AlignmentHorizontalReverseWeekUnconnected extends React.Component{
    render(){
        let data = this.props.data;
        
        let default_text = data.week_type_display+" "+(this.props.week_rank+1);
        
        let nodeweeks = this.props.nodeweeks.map(nodeweek=>{
            
            if(this.props.restriction_set && this.props.restriction_set.nodes && this.props.restriction_set.nodes.indexOf(nodeweek.node)==-1)return null;
            return(
                    <AlignmentHorizontalReverseNode objectID={nodeweek.node} renderer={this.props.renderer} restriction_set={this.props.restriction_set}/>
            );
        });
        
        
        return(
            <div class="week">
                <TitleText text={data.title} defaultText={default_text}/>
                <div class="node-block">
                    {nodeweeks}
                </div>
            </div>
        )
    }
}
const mapAlignmentHorizontalReverseWeekStateToProps = (state,own_props)=>{
    for(var i=0;i<state.week.length;i++){
        if(state.week[i].id==own_props.objectID){
            let week=state.week[i];
            let nodeweeks = Constants.filterThenSortByID(state.nodeweek,week.nodeweek_set);
            return {data:week,nodeweeks:nodeweeks};
        }
    }
}
export const AlignmentHorizontalReverseWeek = connect(
    mapAlignmentHorizontalReverseWeekStateToProps,
    null
)(AlignmentHorizontalReverseWeekUnconnected)




class AlignmentHorizontalReverseNodeUnconnected extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="node";
        this.state={};
    }
    
    render(){
        let data = this.props.data;
        let data_override;
        if(data.represents_workflow) data_override = {...data,...data.linked_workflow_data};
        else data_override={...data};
        let selection_manager = this.props.renderer.selection_manager;
        
        let child_outcomes = this.props.child_outcomes.map(child_outcome=>{
            
            if(!this.state.show_all && this.props.restriction_set && this.props.restriction_set.child_outcomes && this.props.restriction_set.child_outcomes.indexOf(child_outcome)==-1)return null;
            return(
                <AlignmentHorizontalReverseChildOutcome objectID={child_outcome} node_data={data} renderer={this.props.renderer} restriction_set={this.props.restriction_set}/>
            )
        });
        
        let show_all;
        
        //if child outcomes are restricted, we need a show all button that expands to show all of them instead. Otherwise we only need to show the outcomes currently attached to the node.
        let outcomenodes = this.props.outcomenodes.map((outcomenode)=>
            <OutcomeNodeView key={outcomenode.id} objectID={outcomenode.id} renderer={this.props.renderer}/>
        );
        let outcome_restriction = this.props.restriction_set.parent_outcomes.filter(oc=>this.props.all_node_outcomes.indexOf(oc)==-1);
        let outcomes_for_node = (
            <div>
                <div>{gettext("Outcomes for node:")}</div>
                {outcomenodes}
                <OutcomeAdder renderer={this.props.renderer} outcome_set={outcome_restriction} addFunction={updateOutcomenodeDegree.bind(this,this.props.objectID)}/>
            </div>
        );
        let add_new_outcome;
        if(data.linked_workflow) add_new_outcome = (
            <div id="add-new-outcome" class="menu-create hover-shade" onClick={this.addNewChildOutcome.bind(this)}>
                <img class="create-button" src={iconpath+"add_new_white.svg"}/>
                <div>{gettext("Add new")}</div>
            </div>
        );
        if(data.linked_workflow && this.props.restriction_set && this.props.restriction_set.child_outcomes){
            if(this.state.show_all){
                
                show_all = (
                    <div>
                        {add_new_outcome}
                        {outcomes_for_node}
                        <div class="alignment-show-all" onClick={()=>this.setState({show_all:false})}>{"-"+gettext("Hide Unused")}</div>
                    </div>
                );
            }else{
                show_all = (
                    <div>
                        <div class="alignment-show-all" onClick={()=>this.setState({show_all:true})}>{"+"+gettext("Show All")}</div>
                    </div>
                );
            }
        }else{
            show_all = (
                <div>
                    {add_new_outcome}
                    {outcomes_for_node}
                </div>
            );
        }

        let style={backgroundColor:Constants.getColumnColour(this.props.column)};
        if(data.lock){
            style.outline="2px solid "+data.lock.user_colour;
        }
        
        return (
            <div class="node-week">
                <div 
                    style={style} 
                    class={"node column-"+data.column} 
                    onClick={(evt)=>selection_manager.changeSelection(evt,this)}
                >
                    <div class="node-top-row">
                        <NodeTitle data={data}/>
                    </div>
                    <div class="outcome-block">
                        {child_outcomes}
                    </div>
                    <div class="node-drop-row">{show_all}</div>
                    {this.addEditable(data_override,true)}
                </div>
            </div>
        );
    }
    
    addNewChildOutcome(){
        newOutcome(this.props.data.linked_workflow);
    }
}
const mapAlignmentHorizontalReverseNodeStateToProps = (state,own_props)=>{
    for(var i=0;i<state.node.length;i++){
        if(state.node[i].id==own_props.objectID){
            let node=state.node[i];
            let column = state.column.find(column=>column.id==node.column);
            let outcomenodes = Constants.filterThenSortByID(state.outcomenode,node.outcomenode_unique_set);
            if(own_props.restriction_set && own_props.restriction_set.parent_outcomes){
                outcomenodes = outcomenodes.filter(ocn=>own_props.restriction_set.parent_outcomes.indexOf(ocn.outcome)>=0);
            }
            let node_outcomes = Constants.filterThenSortByID(state.outcomenode,node.outcomenode_set).map(ocn=>ocn.outcome);
            if(!node.linked_workflow || node.linked_workflow_data.deleted){
                return {data:node,column:column,child_outcomes:[],outcomenodes:outcomenodes,all_node_outcomes:node_outcomes};
            }
            let child_workflow = getChildWorkflowByID(state,node.linked_workflow);
            let child_outcomes = Constants.filterThenSortByID(state.outcomeworkflow,child_workflow.data.outcomeworkflow_set).map(outcomeworkflow=>outcomeworkflow.outcome);
            return {data:node,column:column,child_outcomes:child_outcomes,outcomenodes:outcomenodes,all_node_outcomes:node_outcomes};
            
        }
    }
}
export const AlignmentHorizontalReverseNode = connect(
    mapAlignmentHorizontalReverseNodeStateToProps,
    null
)(AlignmentHorizontalReverseNodeUnconnected)

class OutcomeAdder extends React.Component{
    render(){
        let options = this.props.outcome_set.map(outcome=>
            <OutcomeAdderOption objectID={outcome}/>
        );
        
        return(
            <select class="outcome-adder" onChange={this.onChange.bind(this)}>
                <option value={0}>{gettext("Add outcome")}</option>
                {options}
            </select>
        );
    }
    
    onChange(evt){
        if(evt.target.value==0)return;
        this.props.renderer.tiny_loader.startLoad();
        this.props.addFunction(evt.target.value,1,(response_data)=>{
            this.props.renderer.tiny_loader.endLoad();
        });
        $(".outcome-adder").val(0);
    }
}

class OutcomeAdderOptionUnconnected extends React.Component{
    render(){
        return (
            <option value={this.props.objectID}>
                {"\u00A0 ".repeat(this.props.data.depth)+getOutcomeTitle(this.props.data,this.props.rank)}
            </option>
        );
    }
}
const mapOutcomeStateToProps = (state,own_props)=>(
    getOutcomeByID(state,own_props.objectID)
)
export const OutcomeAdderOption = connect(
    mapOutcomeStateToProps,
    null
)(OutcomeAdderOptionUnconnected)


class AlignmentHorizontalReverseChildOutcomeUnconnected extends React.Component{
    render(){
        let data = this.props.data;
        let parent_outcomes = this.props.horizontal_links.map(horizontal_link=>{
            for(var i=0;i<this.props.outcomenodes.length;i++){
                if(this.props.outcomenodes[i].outcome==horizontal_link.parent_outcome){
                    if(this.props.restriction_set && this.props.restriction_set.parent_outcomes && this.props.restriction_set.parent_outcomes.indexOf(this.props.outcomenodes[i].outcome)==-1)return null;
                    return (
                        <AlignmentHorizontalReverseParentOutcome child_outcome={this.props.objectID} outcomenode={this.props.outcomenodes[i]} renderer={this.props.renderer}/>
                    );
                }
            }
            return null;
        });
        
        let outcome_restriction = this.props.outcomenodes.filter(ocn=>this.props.all_horizontal_link_outcomes.indexOf(ocn.outcome)==-1).map(ocn=>ocn.outcome);
        if(this.props.restriction_set && this.props.restriction_set.parent_outcomes){
            outcome_restriction = outcome_restriction.filter(oc=>this.props.restriction_set.parent_outcomes.indexOf(oc)>=0).sort((a,b)=>this.props.restriction_set.parent_outcomes.indexOf(a)-this.props.restriction_set.parent_outcomes.indexOf(b));
        }
        
        return(
            <div class="child-outcome">
                <div class="half-width alignment-column">
                    <OutcomeView objectID={data.id} comments={true} edit={true} renderer={this.props.renderer}/>
                </div>
                <div class="half-width alignment-column">
                    {parent_outcomes}
                    <div class="alignment-row">
                        <OutcomeAdder renderer={this.props.renderer} outcome_set={outcome_restriction} addFunction={updateOutcomehorizontallinkDegree.bind(this,this.props.objectID)}/>
                    </div>
                </div>
            </div>
        );
    }
}
const mapAlignmentHorizontalReverseChildOutcomeStateToProps = (state,own_props)=>{
    for(var i=0;i<state.outcome.length;i++){
        if(state.outcome[i].id==own_props.objectID){
            let outcome = state.outcome[i];
            let allowed_outcomenodes = Constants.filterThenSortByID(state.outcomenode,own_props.node_data.outcomenode_set);
            
            let allowed_horizontal_links=Constants.filterThenSortByID(state.outcomehorizontallink,outcome.outcome_horizontal_links_unique);
            let horizontal_link_outcomes = Constants.filterThenSortByID(state.outcomehorizontallink,outcome.outcome_horizontal_links).map(hl=>hl.parent_outcome);
            return {data:outcome,outcomenodes:allowed_outcomenodes,horizontal_links:allowed_horizontal_links,all_horizontal_link_outcomes:horizontal_link_outcomes};
        }
    }
}
export const AlignmentHorizontalReverseChildOutcome = connect(
    mapAlignmentHorizontalReverseChildOutcomeStateToProps,
    null
)(AlignmentHorizontalReverseChildOutcomeUnconnected)


class AlignmentHorizontalReverseParentOutcome extends React.Component{
    render(){
        let data = this.props.outcomenode;
        let props = this.props;
        return(
            <div class="alignment-row">
                <OutcomeNodeView objectID={data.id} renderer={this.props.renderer} deleteSelfOverride={()=>{
                    this.props.renderer.tiny_loader.startLoad();
                    updateOutcomehorizontallinkDegree(props.child_outcome,data.outcome,0,(response_data)=>{
                        props.renderer.tiny_loader.endLoad();
                    });
                }}/>
            </div>
        );
    }
}




class AlignmentHorizontalReverseBlockUnconnected extends React.Component{
    render(){
        let data = this.props.data;
        
        let weekworkflows = this.props.weekworkflows.map(weekworkflow=>{
            let week = weekworkflow.weekworkflow.week;
            if(this.props.restriction_set && this.props.restriction_set.weeks && this.props.restriction_set.weeks.indexOf(week)==-1)return null;
            let week_rank=weekworkflow.rank;
            
        
            let week_component = (
                <AlignmentHorizontalReverseWeek week_rank={week_rank} objectID={week} renderer={this.props.renderer} restriction_set={this.props.restriction_set}/>
            )
            
            return(
                <div class="week-workflow">
                    {week_component}
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
    
    
    let weekworkflows = Constants.filterThenSortByID(state.weekworkflow,state.workflow.weekworkflow_set).map(
        weekworkflow=>({weekworkflow:weekworkflow,rank:state.workflow.weekworkflow_set.indexOf(weekworkflow.id)})
    );
    
    if(own_props.sort=="outcome"){

        let base_outcome = own_props.data;
        let allowed_outcome_ids = [base_outcome.id];
        getDescendantOutcomes(state,base_outcome,allowed_outcome_ids);
        let allowed_outcomes = state.outcome.filter(outcome=>allowed_outcome_ids.includes(outcome.id));
        

        let allowed_child_outcome_ids_from_outcomes = state.outcomehorizontallink.filter(hl=>allowed_outcome_ids.indexOf(hl.parent_outcome)>=0).map(hl=>hl.outcome);
        let allowed_child_outcome_ids = state.outcome.filter(outcome=>allowed_child_outcome_ids_from_outcomes.indexOf(outcome.id)>=0).filter(outcome=>!Constants.checkSetHidden(outcome,state.objectset)).map(outcome=>outcome.id);


        let allowed_node_ids_from_outcomes = state.outcomenode.filter(outcomenode=>allowed_outcome_ids.includes(outcomenode.outcome)).map(outcomenode=>outcomenode.node);
        let allowed_node_ids = state.node.filter(node=>allowed_node_ids_from_outcomes.indexOf(node.id)>=0).filter(node=>!Constants.checkSetHidden(node,state.objectset)).map(node=>node.id);

        let nodeweeks = state.nodeweek.filter(nodeweek=>allowed_node_ids.includes(nodeweek.node));
        let allowed_week_ids = nodeweeks.map(nodeweek=>nodeweek.week);


        return {weekworkflows:weekworkflows,restriction_set:{weeks:allowed_week_ids,nodes:allowed_node_ids,parent_outcomes:allowed_outcome_ids,child_outcomes:allowed_child_outcome_ids}};
    }else if(own_props.sort=="week"){
        let allowed_outcome_ids = [];
        
        let allowed_node_ids = state.node.filter(node=>!Constants.checkSetHidden(node,state.objectset)).map(node=>node.id);
        
        let allowed_child_outcome_ids = state.outcome.filter(outcome=>!Constants.checkSetHidden(outcome,state.objectset)).map(outcome=>outcome.id);
        
        
        for(let i=0;i<own_props.base_outcomes.length;i++){
            for(let j=0;j<own_props.base_outcomes[i].outcomes.length;j++){
                allowed_outcome_ids.push(own_props.base_outcomes[i].outcomes[j].data.id);
                getDescendantOutcomes(state,own_props.base_outcomes[i].outcomes[j].data,allowed_outcome_ids);
            }
        }
        
        
        
        return {weekworkflows:weekworkflows,restriction_set:{weeks:[own_props.data.id],nodes:allowed_node_ids,parent_outcomes:allowed_outcome_ids,child_outcomes:allowed_child_outcome_ids}};
    }
    
    
    
    
    
}
export const AlignmentHorizontalReverseBlock = connect(
    mapAlignmentHorizontalReverseStateToProps,
    null
)(AlignmentHorizontalReverseBlockUnconnected)

