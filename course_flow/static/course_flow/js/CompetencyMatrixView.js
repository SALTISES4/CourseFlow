import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {Component, EditableComponentWithComments, OutcomeTitle, TitleText, NodeTitle} from "./ComponentJSON";
import * as Constants from "./Constants";
import {getSortedOutcomeIDFromOutcomeWorkflowSet, getOutcomeByID, getWeekWorkflowByID, getWeekByID, getNodeWeekByID, getNodeByID, getOutcomeNodeByID, getTableOutcomeNodeByID} from "./FindState";
import {WorkflowOutcomeLegend} from "./WorkflowLegend";
import {TableOutcomeBase} from "./OutcomeView";
import {NodeOutcomeView} from "./NodeView";

class CompetencyMatrixView extends React.Component{
    constructor(props){
        super(props);
        this.objectType="workflow";
    }
    render(){

        let nodecategory = this.getNodecategory();
        let nodecategory_json = JSON.stringify(nodecategory);
        if(this.nodecategory_json==nodecategory_json)nodecategory=this.nodecategory;
        else{this.nodecategory=nodecategory;this.nodecategory_json=nodecategory_json;}
        let outcomes_sorted = this.getOutcomesSorted();

        let has_nodes=false;
        for(let i=0;i<nodecategory.length;i++){
            if(nodecategory[i].nodes.length>0){has_nodes=true;break;}
        }
        
        if(outcomes_sorted.length==0 || !has_nodes){
            let text;
            if(this.props.renderer.view_type=="outcometable")text=gettext("This view renders a table showing the relationships between nodes and outcomes. Add outcomes and nodes to the workflow to get started.");
            else text = gettext("This view renders a table showing the relationships between this workflow's outcomes and the outcomes of their linked workflows. To use this feature, you must link the nodes in this workflow to child workflows (ex. program nodes to course workflows) and ensure that those child workflows have their own sets of outcomes.");
            return(
                <div class="emptytext">
                    {text}
                </div>
            );
        }else{
            let nodes;
            nodes = nodecategory.map((nodecategory)=>
                <div class="table-group">
                    <div class="table-cell nodewrapper blank-cell"></div>
                    <div class="table-cell nodewrapper total-cell"><div class="node-category-header">{nodecategory.title}</div></div>
                    {nodecategory.nodes.map((node)=>
                            <NodeOutcomeView renderer={this.props.renderer} objectID={node}/>
                    )}
                </div>
            );
            let blank_line = nodecategory.map((nodecategory)=>
                <div class="table-group">
                    <div class="table-cell blank-cell"></div>
                    <div class="table-cell total-cell blank-cell"></div>
                    {nodecategory.nodes.map((node)=>
                        <div class="table-cell nodewrapper blank-cell"></div>
                    )}
                </div>
            );
            let outcomes = outcomes_sorted.map((category)=>
                <div class="table-body">
                    {this.props.object_sets.length>0 &&
                        <div class="outcome-row outcome-category">
                            <div class="outcome-wrapper"><div class="outcome-head"><h4>{category.objectset.title}</h4></div></div>
                            <div class="outcome-cells">{blank_line}</div>
                            <div class="table-cell blank-cell"></div>
                            <div class="table-cell blank-cell total-cell grand-total-cell"></div>
                        </div>
                    }
                {category.outcomes.map(outcome=>
                    <TableOutcomeBase key={outcome} renderer={this.props.renderer} objectID={outcome} nodecategory={nodecategory} outcomes_type={this.props.outcomes_type} type="competency_matrix"/>
                )}</div>                                       
            );
            let blank_row = Array(10).fill(
                <div class="table-cell empty-cell"></div>
            );
            let weeks = nodecategory.map((category)=>
                <div class="matrix-time-week">
                    <MatrixWeekView objectID={category.id} renderer={this.props.renderer}/>
                    {category.nodes.map((node)=>
                        <MatrixNodeView objectID={node} renderer={this.props.renderer}/>
                    )
                    }
                    <div class="matrix-time-row">
                        {blank_row}
                    </div>
                </div>
            );
            let time_header=(
                <div class="matrix-time-row">
                    <div class="table-cell outcome-wrapper"><div class="outcome-head"><h4>{gettext("Hours")}</h4></div></div>
                    <div class="table-cell outcome-wrapper"><div class="outcome-head">{gettext("General Education")}</div></div>
                    <div class="table-cell outcome-wrapper"><div class="outcome-head">{gettext("Specific Education")}</div></div>
                    <div class="table-cell outcome-wrapper"><div class="outcome-head">{gettext("Total Hours")}</div></div>
                    <div class="table-cell outcome-wrapper"><div class="outcome-head"><h4>{gettext("Ponderation")}</h4></div></div>
                    <div class="table-cell outcome-wrapper"><div class="outcome-head">{gettext("Theory")}</div></div>
                    <div class="table-cell outcome-wrapper"><div class="outcome-head">{gettext("Practical")}</div></div>
                    <div class="table-cell outcome-wrapper"><div class="outcome-head">{gettext("Individual Work")}</div></div>
                    <div class="table-cell outcome-wrapper"><div class="outcome-head">{gettext("Total")}</div></div>
                    <div class="table-cell outcome-wrapper"><div class="outcome-head">{gettext("Credits")}</div></div>
                </div>                         
            );
            let totals=this.getTotals();
            let grand_total=(
                <div class="matrix-time-row">
                    <div class="total-cell grand-total-cell table-cell blank"></div>
                    <div class="total-cell grand-total-cell table-cell">{totals.general_education}</div>
                    <div class="total-cell grand-total-cell table-cell">{totals.specific_education}</div>
                    <div class="total-cell grand-total-cell table-cell">{totals.general_education+totals.specific_education}</div>
                    <div class="total-cell grand-total-cell table-cell blank"></div>
                    <div class="total-cell grand-total-cell table-cell">{totals.total_theory}</div>
                    <div class="total-cell grand-total-cell table-cell">{totals.total_practical}</div>
                    <div class="total-cell grand-total-cell table-cell">{totals.total_individual}</div>
                    <div class="total-cell grand-total-cell table-cell">{totals.total_time}</div>
                    <div class="total-cell grand-total-cell table-cell">{totals.total_required}</div>
                </div>
            )
            return(
                <div class="competency-matrix node-rows">
                    <div class="outcome-row node-row"><div class="outcome-wrapper"><div class="outcome-head empty"></div></div><div class="outcome-cells">{nodes}</div>
                    <div class="table-cell blank-cell"><div class="node-category-header"></div></div><div class="table-cell total-cell grand-total-cell"><div class="total-header">Grand Total</div></div></div>
                    {outcomes}
                    <div class="matrix-time-block">
                        {time_header}
                        {weeks}
                        {grand_total}
                    </div>
                </div>
            );
        }
    }

    getOutcomesSorted(){
        return getSortedOutcomeIDFromOutcomeWorkflowSet(this.props.outcomes,this.props.outcomeworkflows,this.props.outcomeworkflow_order,this.props.object_sets);
    
    }

    getNodecategory(){

        let week_order = Constants.filterThenSortByID(this.props.weekworkflows,this.props.weekworkflow_order).map(weekworkflow=>weekworkflow.week);
        let weeks_ordered = Constants.filterThenSortByID(this.props.weeks,week_order);
        let nodeweek_order = [].concat(...weeks_ordered.map((week)=>week.nodeweek_set));
        let nodeweeks_ordered = Constants.filterThenSortByID(this.props.nodeweeks,nodeweek_order)
        let node_order = nodeweeks_ordered.map(nodeweek=>nodeweek.node);
        let nodes_ordered = Constants.filterThenSortByID(this.props.nodes,node_order).filter(node=>!Constants.checkSetHidden(node,this.props.object_sets));
        
        let nodes_allowed = nodes_ordered.map(node=>node.id);
        nodeweeks_ordered = nodeweeks_ordered.filter(nodeweek=>nodes_allowed.indexOf(nodeweek.node)>=0);
        let nodes_by_week={};
        for(let i=0;i<nodeweeks_ordered.length;i++){
            let nodeweek = nodeweeks_ordered[i];
            Constants.pushOrCreate(nodes_by_week,nodeweek.week,nodeweek.node);
        }
        return weeks_ordered.map((week,index)=>{return {title:(week.title||week.week_type_display+" "+(index+1)),id:week.id,nodes:(nodes_by_week[week.id]||[])};});
    
    }

    getTotals(){ 
        let nodes_data = this.props.nodes.filter(node=>!Constants.checkSetHidden(node,this.props.objectset));
        let linked_wf_data = nodes_data.map(node=>{
            if(node.represents_workflow)return {...node,...node.linked_workflow_data};
            return node
        });
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
            if(currentValue && currentValue.time_required)return previousValue+parseFloat(currentValue.time_required);
            return previousValue;
        },0);

        return {total_theory:total_theory,total_practical:total_practical,total_individual:total_individual,total_required:total_required,total_time:total_time,general_education:general_education,specific_education:specific_education};

    }



}
const mapStateToProps = (state,own_props)=>{
    return {
        weekworkflows:state.weekworkflow,
        weeks:state.week,
        nodeweeks:state.nodeweek,
        nodes:state.node,
        object_sets:state.objectset,
        weekworkflow_order:state.workflow.weekworkflow_set,
        outcomes_sort:state.workflow.outcomes_sort,
        outcomeworkflow_order:state.workflow.outcomeworkflow_set,
        outcomeworkflows:state.outcomeworkflow,
        outcomes:state.outcome,
    };
}
const mapDispatchToProps = {};
export default connect(
    mapStateToProps,
    null
)(CompetencyMatrixView)

class MatrixWeekViewUnconnected extends Component{
    constructor(props){
        super(props);
        this.objectType="week";
    }
    
    render(){
        let data = this.props.data;
        
        let default_text = data.week_type_display+" "+(this.props.rank+1);
         
        return (
            <div class="matrix-time-row">
                <div class="total-cell table-cell blank"></div>
                <div class="total-cell table-cell">{this.props.general_education}</div>
                <div class="total-cell table-cell">{this.props.specific_education}</div>
                <div class="total-cell table-cell">{this.props.general_education+this.props.specific_education}</div>
                <div class="total-cell table-cell blank"></div>
                <div class="total-cell table-cell">{this.props.total_theory}</div>
                <div class="total-cell table-cell">{this.props.total_practical}</div>
                <div class="total-cell table-cell">{this.props.total_individual}</div>
                <div class="total-cell table-cell">{this.props.total_time}</div>
                <div class="total-cell table-cell">{this.props.total_required}</div>
            </div>
        )
    }
    
}
const mapWeekStateToProps = (state,own_props)=>{
    let data = getWeekByID(state,own_props.objectID).data;
    let node_weeks = Constants.filterThenSortByID(state.nodeweek,data.nodeweek_set);
    let nodes_data = Constants.filterThenSortByID(state.node,node_weeks.map(node_week=>node_week.node)).filter(node=>!Constants.checkSetHidden(node,state.objectset));
    let linked_wf_data = nodes_data.map(node=>{
        if(node.represents_workflow)return {...node,...node.linked_workflow_data};
        return node
    });
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
        if(currentValue && currentValue.time_required)return previousValue+parseFloat(currentValue.time_required);
        return previousValue;
    },0);
    
    
    
    return {data:data,total_theory:total_theory,total_practical:total_practical,total_individual:total_individual,total_required:total_required,total_time:total_time,general_education:general_education,specific_education:specific_education,object_sets:state.objectset,nodes:nodes_data};
}
export const MatrixWeekView = connect(
    mapWeekStateToProps,
    null
)(MatrixWeekViewUnconnected)

class MatrixNodeViewUnconnected extends Component{
    constructor(props){
        super(props);
        this.objectType="node";
    }
    
    render(){
        let data = this.props.data;
        let data_override;
        if(data.represents_workflow)data_override = {...data,...data.linked_workflow_data,id:data.id}
        else data_override = data;
        
        
        let css_class="node column-"+data.column+" "+Constants.node_keys[data.node_type];
        
        let style = {};
        style.backgroundColor=Constants.getColumnColour(this.props.column)
        
        
        return (
            <div class="matrix-time-row">
                <div class="table-cell blank"></div>
                {this.getTimeData(data_override)}
            </div>
        )
    }
    
    getTimeData(data){
        return(
            [
                <div class="table-cell">{data.time_general_hours}</div>,
                <div class="table-cell">{data.time_specific_hours}</div>,
                <div class="table-cell">{(data.time_general_hours||0)+(data.time_specific_hours||0)}</div>,
                <div class="table-cell blank"></div>,
                <div class="table-cell">{data.ponderation_theory}</div>,
                <div class="table-cell">{data.ponderation_practical}</div>,
                <div class="table-cell">{data.ponderation_individual}</div>,
                <div class="table-cell">{data.ponderation_theory+
                data.ponderation_practical+
                data.ponderation_individual}</div>,
                <div class="table-cell" titletext={this.props.renderer.time_choices[data.time_units].name}>{data.time_required}</div>,
            ]
        )
    }
    
}
const mapNodeStateToProps = (state,own_props)=>getNodeByID(state,own_props.objectID)
export const MatrixNodeView = connect(
    mapNodeStateToProps,
    null
)(MatrixNodeViewUnconnected)



