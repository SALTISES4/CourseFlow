import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON, OutcomeTitle, TitleText, NodeTitle} from "./ComponentJSON";
import * as Constants from "./Constants";
import {getOutcomeByID, getWeekWorkflowByID, getWeekByID, getNodeWeekByID, getNodeByID} from "./FindState";


//Creates a grid with just nodes by week and their times
class GridView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="workflow";
        this.state={dropped_list:[]}
    }
    
    render(){
        
        let data = this.props.workflow;
        
        
        let weeks = this.props.weeks.map((week,i)=>
            <GridWeekView renderer={this.props.renderer} data={week.data} rank={i}/>
        );

        return(
            <div class="workflow-details">
                <div class="grid-ponderation">{gettext("Times in hours shown in format")+": "+gettext("Theory")+"/"+gettext("Practical")+"/"+gettext("Individual")}</div>
                <div class="workflow-grid">
                    {weeks}
                </div>
            </div>
        );
    }
}
const mapStateToProps = (state,own_props)=>{
    let weeks = state.workflow.weekworkflow_set.map(weekworkflow=>getWeekWorkflowByID(state,weekworkflow).data.week).map(week=>getWeekByID(state,week));
    return {workflow:state.workflow,weeks:weeks};
}
export default connect(
    mapStateToProps,
    null
)(GridView)

class GridWeekViewUnconnected extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="week";
    }
    
    render(){
        let data = this.props.data;
        
        let default_text = data.week_type_display+" "+(this.props.rank+1);
        console.log(this.props.nodes);
        let nodes = this.props.nodes.map(node=>
            <GridNodeView renderer={this.props.renderer} data={node}/>
        );
        
        
        return (
            <div class="week">
                <div class="week-title">
                    <TitleText title={data.title} defaultText={default_text}/>
                    <div class="grid-ponderation">{this.props.total_theory+"/"+this.props.total_practical+"/"+this.props.total_individual}</div>
                </div>
                {nodes}
            </div>
        )
    }
}
const mapWeekStateToProps = (state,own_props)=>{
    let data = own_props.data;
    console.log(data);
    let node_weeks = Constants.filterThenSortByID(state.nodeweek,data.nodeweek_set);
    let nodes_data = Constants.filterThenSortByID(state.node,node_weeks.map(node_week=>node_week.node));
    
    
    let linked_wf_data = nodes_data.map(node=>node.linked_workflow_data);
    let general_education = linked_wf_data.reduce((previousValue,currentValue)=>{
        if(currentValue && currentValue.time_general_hours)return previousValue+currentValue.time_general_hours;
        return previousValue;
    },0);
    let specific_education = linked_wf_data.reduce((previousValue,currentValue)=>{
        if(currentValue && currentValue.time_specific_hours)return previousValue+currentValue.time_specific_hours;
        return previousValue;
    },0);
    let total_theory = linked_wf_data.reduce((previousValue,currentValue)=>{
        if(currentValue && currentValue.ponderation_theory)return previousValue+currentValue.ponderation_theory;
        return previousValue;
    },0);
    let total_practical = linked_wf_data.reduce((previousValue,currentValue)=>{
        if(currentValue && currentValue.ponderation_practical)return previousValue+currentValue.ponderation_practical;
        return previousValue;
    },0);
    let total_individual = linked_wf_data.reduce((previousValue,currentValue)=>{
        if(currentValue && currentValue.ponderation_individual)return previousValue+currentValue.ponderation_individual;
        return previousValue;
    },0);
    let total_time = total_theory+total_practical+total_individual;
    let total_required = linked_wf_data.reduce((previousValue,currentValue)=>{
        if(currentValue && currentValue.time_required)return previousValue+parseInt(currentValue.time_required);
        return previousValue;
    },0);
    
    return {nodes:nodes_data,general_education:general_education,specific_education:specific_education,total_theory:total_theory,total_practical:total_practical,total_individual:total_individual,total_time:total_time,total_required:total_required};
}
export const GridWeekView = connect(
    mapWeekStateToProps,
    null
)(GridWeekViewUnconnected)

class GridNodeViewUnconnected extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="node";
    }
    
    render(){
        let data = this.props.data;
        let ponderation;
        if(data.linked_workflow){
            ponderation = (
                <div class="grid-ponderation">{data.linked_workflow_data.ponderation_theory+"/"+data.linked_workflow_data.ponderation_practical+"/"+data.linked_workflow_data.ponderation_individual}</div>
            )
        }
        return (
            <div class={
                    "node column-"+data.column+((this.state.selected && " selected")||"")+((data.is_dropped && " dropped")||"")+" "+Constants.node_keys[data.node_type]
                }
                style={
                    {backgroundColor:this.props.renderer.column_colours[data.column]}
                }>
                <div class = "node-top-row">
                    <NodeTitle data={data}/>
                    {ponderation}
                </div>
            </div>
        )
    }
    
}
/****returns nothing for now, but might eventually *****/
const mapNodeStateToProps = (state,own_props)=>({
    
})
export const GridNodeView = connect(
    mapNodeStateToProps,
    null
)(GridNodeViewUnconnected)
