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
    let node_weeks = Constants.filterThenSortByID(state.nodeweek,data.nodeweek_set);
    let nodes_data = Constants.filterThenSortByID(state.node,node_weeks.map(node_week=>node_week.node)).filter(node=>!Constants.checkSetHidden(node,state.objectset));
    
    let override_data = nodes_data.map(node=>{
        if(node.represents_workflow)return {...node,...node.linked_workflow_data};
        else return node;
    })
    let general_education = override_data.reduce((previousValue,currentValue)=>{
        if(currentValue && currentValue.time_general_hours)return previousValue+currentValue.time_general_hours;
        return previousValue;
    },0);
    let specific_education = override_data.reduce((previousValue,currentValue)=>{
        if(currentValue && currentValue.time_specific_hours)return previousValue+currentValue.time_specific_hours;
        return previousValue;
    },0);
    let total_theory = override_data.reduce((previousValue,currentValue)=>{
        if(currentValue && currentValue.ponderation_theory)return previousValue+currentValue.ponderation_theory;
        return previousValue;
    },0);
    let total_practical = override_data.reduce((previousValue,currentValue)=>{
        if(currentValue && currentValue.ponderation_practical)return previousValue+currentValue.ponderation_practical;
        return previousValue;
    },0);
    let total_individual = override_data.reduce((previousValue,currentValue)=>{
        if(currentValue && currentValue.ponderation_individual)return previousValue+currentValue.ponderation_individual;
        return previousValue;
    },0);
    let total_time = total_theory+total_practical+total_individual;
    let total_required = override_data.reduce((previousValue,currentValue)=>{
        if(currentValue && currentValue.time_required)return previousValue+parseInt(currentValue.time_required);
        return previousValue;
    },0);
    
    return {nodes:override_data,general_education:general_education,specific_education:specific_education,total_theory:total_theory,total_practical:total_practical,total_individual:total_individual,total_time:total_time,total_required:total_required};
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
        let renderer = this.props.renderer;
        let selection_manager=renderer.selection_manager;
        let data = this.props.data;
        let data_override;
        if(data.represents_workflow)data_override = {...data,...data.linked_workflow_data}
        else data_override = data;
        let ponderation;
        ponderation = (
            <div class="grid-ponderation">{data_override.ponderation_theory+"/"+data_override.ponderation_practical+"/"+data_override.ponderation_individual}</div>
        )
        
        let style = {backgroundColor:Constants.getColumnColour(this.props.column)}
        if(data.lock){
            style.outline="2px solid "+data.lock.user_colour;
        }
        let css_class="node column-"+data.column+" "+Constants.node_keys[data.node_type];
        if(data.is_dropped)css_class+=" dropped";
        if(data.lock)css_class+=" locked locked-"+data.lock.user_id;
        
        return (
            <div style={style}
                id={data.id} 
                ref={this.maindiv} 
                onClick={(evt)=>selection_manager.changeSelection(evt,this)}
                class={css_class}
                style={style}>
                <div class = "node-top-row">
                    <NodeTitle data={data}/>
                    {ponderation}
                </div>
                {this.addEditable(data_override)}
            </div>
        )
    }
    
}

const mapNodeStateToProps = (state,own_props)=>({
    column:state.column.find(column=>column.id==own_props.data.column),
})
export const GridNodeView = connect(
    mapNodeStateToProps,
    null
)(GridNodeViewUnconnected)
