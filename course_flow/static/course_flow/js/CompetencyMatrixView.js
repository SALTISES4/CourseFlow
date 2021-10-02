import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON, OutcomeTitle, TitleText, NodeTitle} from "./ComponentJSON";
import * as Constants from "./Constants";
import {getOutcomeByID, getWeekWorkflowByID, getWeekByID, getNodeWeekByID, getNodeByID, getOutcomeNodeByID, getTableOutcomeNodeByID} from "./FindState";
import {TableOutcomeNode} from "./OutcomeNode";


//Creates a competency matrix. Probably should only be active at the program level.
class CompetencyMatrixView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="workflow";
        this.state={dropped_list:[]}
    }
    
    render(){
        
        let data = this.props.workflow;
        
        if(data.outcomeworkflow_set.length==0){
            let text=gettext("This view renders a table showing the relationships between nodes and outcomes. Add outcomes and nodes to the workflow to get started.");
            return(
                <div class="emptytext">
                    {text}
                </div>
            );
        }else{
            let outcomes = this.props.outcomes_tree.map((outcome)=>
                <MatrixOutcomeView renderer={this.props.renderer} tree_data={outcome} objectID={outcome.id} dropped_list={this.state.dropped_list}/>
            );
            
            let weekworkflows = data.weekworkflow_set.map((weekworkflow,i)=>
                <MatrixWeekWorkflowView renderer={this.props.renderer} objectID={weekworkflow} rank={i} outcomes_tree={this.props.outcomes_tree} dropped_list={this.state.dropped_list}/>                                         
            );
            
            return(
                <div class="workflow-details">
                    <div ref={this.maindiv} class="outcome-table competency-matrix">
                        <div class="outcome-row node-row">
                            <div class="outcome-head"></div>
                            <div class="table-cell nodewrapper blank"><div class="outcome"></div></div>
                            <div class="outcome-cells">{outcomes}</div>
                            <div class="table-cell nodewrapper blank"><div class="outcome"></div></div>
                            <div class="table-cell nodewrapper"><div class="outcome">{gettext("General Education")}</div></div>
                            <div class="table-cell nodewrapper"><div class="outcome">{gettext("Specific Education")}</div></div>
                            <div class="table-cell nodewrapper"><div class="outcome">{gettext("Total Hours")}</div></div>
                            <div class="table-cell nodewrapper blank"><div class="outcome"></div></div>
                            <div class="table-cell nodewrapper"><div class="outcome">{gettext("Theory")}</div></div>
                            <div class="table-cell nodewrapper"><div class="outcome">{gettext("Practical")}</div></div>
                            <div class="table-cell nodewrapper"><div class="outcome">{gettext("Individual Work")}</div></div>
                            <div class="table-cell nodewrapper"><div class="outcome">{gettext("Total")}</div></div>
                            <div class="table-cell nodewrapper"><div class="outcome">{gettext("Time")}</div></div>
                        </div>
                        {weekworkflows}
                    </div>
                    <button class="menu-create" onClick={this.outputCSV.bind(this)}>{gettext("Output CSV")}</button>
                </div>
            );
        }
    }
    
    getOutcomes(outcomes_tree,state,display=true){
        let outcomes=[];
        outcomes_tree.forEach(outcome=>{
            let descendants;
            descendants = this.getOutcomes(outcome.children,state,this.state.dropped_list.indexOf(outcome.id)>=0);
            outcomes.push({...getOutcomeByID(state,outcome.id),descendants:descendants.map(des=>des.data.id),display:display});
            outcomes.concat(descendants);
        });
        return outcomes;
        
    }
    
    getWeeks(state){
        let weeks = Constants.filterThenSortByID(state.week,Constants.filterThenSortByID(state.weekworkflow,state.workflow.weekworkflow_set).map(weekworkflow=>weekworkflow.week)).map(week=>{
            let nodes = Constants.filterThenSortByID(state.node,Constants.filterThenSortByID(state.nodeweek,week.nodeweek_set).map(nodeweek=>nodeweek.node));
            return {week_data:week,nodes:nodes}
        });
        return weeks;
        
    }
    
    createWeekRow(week_data,rank,outcome_ids,totals_data){
        let text = week_data.week_type_display+" "+(rank+1);
        if(week_data.title)text = week_data.title;
        let row = text+",";
        row+=outcome_ids.map(id=>"").join(",")+",";
        row+=","+totals_data.general_education;
        row+=","+totals_data.specific_education;
        row+=","+(totals_data.general_education+totals_data.specific_education);
        row+=",";
        row+=","+totals_data.theory;
        row+=","+totals_data.practical;
        row+=","+totals_data.individual;
        row+=","+totals_data.total;
        row+=","+totals_data.required;
        return row;
    }
    
    createNodeRow(state,node_data,outcomes_displayed,totals_data){
        let title="";
        let linked_workflow_data=node_data.linked_workflow_data;
        if(linked_workflow_data){
            if(linked_workflow_data.code)title=linked_workflow_data.code+" - ";
            title+=linked_workflow_data.title;
        }else title+=node_data.title;
        
        let row = title+",";
        let outcomenodes_all = state.outcomenode.filter(outcomenode=>outcomenode.node==node_data.id);
        row+=outcomes_displayed.map(outcome=>{
            let outcomenode = getTableOutcomeNodeByID(state,node_data.id,outcome.data.id).data;
            let degree;
            if(!outcomenode){
                for(let i=0;i<outcome.descendants.length;i++){
                    for(let j=0;j<outcomenodes_all.length;j++){
                        if(outcome.descendants[i]==outcomenodes_all[j].outcome){
                            degree=0;
                            break;
                        }
                    }
                    if(degree===0)break;
                }
            }else{
                degree=outcomenode.degree;
            }
            
            if(degree===0)return "P";
            else if(degree==1)return "X";
            else{
                let returnval="";
                if(degree & 2)returnval+="I";
                if(degree & 4)returnval+="D";
                if(degree & 8)returnval+="A";
            }
            
            
        }).join(",");
        if(linked_workflow_data){
            row+=",";
            let general_education = linked_workflow_data.time_general_hours;
            row+=","+general_education;
            if(!general_education)general_education=0;
            totals_data.general_education+=general_education;
            let specific_education = linked_workflow_data.time_specific_hours;
            row+=","+specific_education;
            if(!specific_education)specific_education=0;
            totals_data.specific_education+=specific_education;
            row+=","+(general_education+specific_education);
            row+=",";
            let theory = linked_workflow_data.ponderation_theory
            row+=","+theory;
            if(!theory)theory=0;
            totals_data.theory+=theory;
            let practical = linked_workflow_data.ponderation_practical
            row+=","+practical;
            if(!practical)practical=0;
            totals_data.practical+=practical;
            let individual = linked_workflow_data.ponderation_individual
            row+=","+individual;
            if(!individual)individual=0;
            totals_data.individual+=individual;
            let total = theory+practical+individual;
            row+=","+total;
            totals_data.total+=total;
            let time_required = parseInt(linked_workflow_data.time_required);
            if(!time_required)time_required=0;
            row+=","+time_required;
            totals_data.required+=time_required;
        }
        else row+=",,,,,,,,,,";
        return row;
    }

    outputCSV(){
        
        let state = this.props.renderer.store.getState();
        
        //Get the top row of competencies
        let outcomes = this.getOutcomes(this.props.outcomes_tree,state,outcomes);
        let outcomes_displayed = outcomes.filter(outcome=>outcome.display)
        let outcomes_row = ","+outcomes_displayed.map(outcome=>{
            return '"'+Constants.csv_safe(outcome.rank.join(".")+" - "+outcome.data.title)+'"';
        }).join(",");
        outcomes_row+=",,Gen Ed, Specific Ed,Total Hours,,Theory,Practical,Individual,Total,Credits";
        
        //Get individual weeks and nodes
        let weeks = this.getWeeks(state)
        
        
        //Convert each week/node into a row
        let rows=[outcomes_row];
        weeks.forEach((week,i)=>{
            let totals_data = {theory:0,practical:0,individual:0,total:0,required:0,general_education:0,specific_education:0};
            week.nodes.forEach(node=>{
                let node_row = this.createNodeRow(state,node,outcomes_displayed,totals_data);
                rows.push(node_row);
            });
            let week_row = this.createWeekRow(week.week_data,i,outcomes_displayed,totals_data);
            rows.push(week_row);
            rows.push("\n");
        });
        
        alert(gettext("Data has been output to csv and will appear in your downloads folder."));
        
        Constants.download("outcomes_matrix.csv",rows.join("\n"));
        
        
    }
    
    postMountFunction(){
        $(this.maindiv.current).on("toggle-outcome-drop",(evt,extra_data)=>{
            this.setState((prev_state)=>{
                let dropped = prev_state.dropped_list.slice();
                if(dropped.indexOf(extra_data.id)>=0)dropped.splice(dropped.indexOf(extra_data.id),1);
                else dropped.push(extra_data.id);
                return {dropped_list:dropped};
            })
        });
    }
}
const mapStateToProps = (state,own_props)=>{
    let outcomes_tree = Constants.createOutcomeTree(state);
    let outcomes_ordered = [];
    Constants.flattenOutcomeTree(outcomes_tree,outcomes_ordered);
    return {workflow:state.workflow,outcomes_tree:outcomes_tree,outcomes_ordered:outcomes_ordered};
}
export default connect(
    mapStateToProps,
    null
)(CompetencyMatrixView)

class MatrixOutcomeViewUnconnected extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="outcome";
    }
    
    render(){
        let data = this.props.data;
        let children = this.props.tree_data.children.map(outcome=>
            <MatrixOutcomeView renderer={this.props.renderer} tree_data={outcome} objectID={outcome.id} dropped_list={this.props.dropped_list}/>      
        )
               
        let is_dropped = this.props.dropped_list.indexOf(data.id)>=0;
        let dropIcon;
        if(is_dropped)dropIcon = "droptriangleup";
        else dropIcon = "droptriangledown";
        
        let class_name="outcome-block";
        if(is_dropped)class_name+=" dropped";
        return (
            <div class={class_name}>
                <div class="table-cell nodewrapper">
                    <div class="outcome">
                        <OutcomeTitle data={data} titles={this.props.titles} rank={this.props.rank}/>
                        {children.length>0 && 
                            <div class="outcome-drop" onClick={this.toggleDrop.bind(this)}>
                                <div class = "outcome-drop-img">
                                    <img src={iconpath+dropIcon+".svg"}/>
                                </div>
                            </div>
                        }
                    </div>
                </div>
                <div class="outcome-block-children">
                    {children}
                </div>
            </div>
        )
    }
    
    toggleDrop(){
        $(".competency-matrix").triggerHandler("toggle-outcome-drop",{id:this.props.objectID})
    }
}
const mapOutcomeStateToProps = (state,own_props)=>(
    getOutcomeByID(state,own_props.objectID)
)
export const MatrixOutcomeView = connect(
    mapOutcomeStateToProps,
    null
)(MatrixOutcomeViewUnconnected)

class MatrixWeekWorkflowViewUnconnected extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="weekworkflow";
    }
    
    render(){
        let data = this.props.data;
        
        return (
            <MatrixWeekView outcomes_tree={this.props.outcomes_tree} renderer={this.props.renderer} objectID={data.week} rank={this.props.rank} dropped_list={this.props.dropped_list}/>
        )
    }
    
}
const mapWeekWorkflowStateToProps = (state,own_props)=>(
    getWeekWorkflowByID(state,own_props.objectID)
)
export const MatrixWeekWorkflowView = connect(
    mapWeekWorkflowStateToProps,
    null
)(MatrixWeekWorkflowViewUnconnected)

class MatrixWeekViewUnconnected extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="week";
    }
    
    render(){
        let data = this.props.data;
        
        let default_text = data.week_type_display+" "+(this.props.rank+1);
        
        let nodeweeks = data.nodeweek_set.map(nodeweek=>
            <MatrixNodeWeekView outcomes_tree={this.props.outcomes_tree} renderer={this.props.renderer} objectID={nodeweek} dropped_list={this.props.dropped_list}/>
        )
        
        let outcomecells = this.props.outcomes_tree.map(outcome=>
            <MatrixWeekOutcomeBlockView renderer={this.props.renderer} data={outcome} dropped_list={this.props.dropped_list}/>
        )
        
        return (
            <div class="week">
                <div class="node-row">
                    <div class="outcome-head">
                        <TitleText title={data.title} defaultText={default_text}/>
                    </div>
                    <div class="table-cell blank"></div>
                    {outcomecells}
                    <div class="table-cell blank"></div>
                    <div class="table-cell">{this.props.general_education}</div>
                    <div class="table-cell">{this.props.specific_education}</div>
                    <div class="table-cell">{this.props.general_education+this.props.specific_education}</div>
                    <div class="table-cell blank"></div>
                    <div class="table-cell">{this.props.total_theory}</div>
                    <div class="table-cell">{this.props.total_practical}</div>
                    <div class="table-cell">{this.props.total_individual}</div>
                    <div class="table-cell">{this.props.total_time}</div>
                    <div class="table-cell">{this.props.total_required}</div>
                </div>
                {nodeweeks}
            </div>
        )
    }
    
}
const mapWeekStateToProps = (state,own_props)=>{
    let data = getWeekByID(state,own_props.objectID).data;
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
    
    
    
    return {data:data,total_theory:total_theory,total_practical:total_practical,total_individual:total_individual,total_required:total_required,total_time:total_time,general_education:general_education,specific_education:specific_education};
}
export const MatrixWeekView = connect(
    mapWeekStateToProps,
    null
)(MatrixWeekViewUnconnected)

class MatrixWeekOutcomeBlockView extends React.Component{
    constructor(props){
        super(props);
        this.objectType="outcome";
        this.state={descendant_completion_status:{}}
    }
    
    render(){
        let children;
        let data = this.props.data;
        if(data.children) children = data.children.map(outcome=>
            <MatrixOutcomeBlockView renderer={this.props.renderer} data={outcome} outcomes_type={this.props.outcomes_type} dropped_list={this.props.dropped_list}/>
        )
        let class_name="outcome-block";
        if(this.props.dropped_list.indexOf(data.id)>=0)class_name+=" dropped";
        return(
            <div class={class_name}>
                <div class="table-cell"></div>
                <div class="outcome-block-children">
                    {children}
                </div>
            </div>
        );
    }
}

class MatrixNodeWeekViewUnconnected extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="nodeweek";
    }
    
    render(){
        let data = this.props.data;
        
        return (
            <MatrixNodeView outcomes_tree={this.props.outcomes_tree} renderer={this.props.renderer} objectID={data.node} dropped_list={this.props.dropped_list}/>
        )
    }
    
}
const mapNodeWeekStateToProps = (state,own_props)=>(
    getNodeWeekByID(state,own_props.objectID)
)
export const MatrixNodeWeekView = connect(
    mapNodeWeekStateToProps,
    null
)(MatrixNodeWeekViewUnconnected)

class MatrixNodeViewUnconnected extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="node";
    }
    
    render(){
        let data = this.props.data;
        let outcomenodes = this.props.outcomes_tree.map(outcome=>
            <MatrixOutcomeBlockView renderer={this.props.renderer} nodeID={data.id} data={outcome} outcomes_type={this.props.outcomes_type} dropped_list={this.props.dropped_list}/>
        )
        
        return (
            <div class="node-row">
                <div class="outcome-head">
                    <div class={
                            "node column-"+data.column+((this.state.selected && " selected")||"")+((data.is_dropped && " dropped")||"")+" "+Constants.node_keys[data.node_type]
                        }
                        style={
                            {backgroundColor:this.props.renderer.column_colours[data.column]}
                        }>
                        <div class = "node-top-row">
                            <NodeTitle data={data}/>
                        </div>
                    </div>
                </div>
                <div class="table-cell blank"></div>
                {outcomenodes}
                <div class="table-cell blank"></div>
                {this.getTimeData()}
            </div>
        )
    }
    
    getTimeData(){
        let linked_workflow_data = this.props.data.linked_workflow_data;
        if(linked_workflow_data){
            return(
                [
                    <div class="table-cell">{linked_workflow_data.time_general_hours}</div>,
                    <div class="table-cell">{linked_workflow_data.time_specific_hours}</div>,
                    <div class="table-cell">{(linked_workflow_data.time_general_hours||0)+(linked_workflow_data.time_specific_hours||0)}</div>,
                    <div class="table-cell blank"></div>,
                    <div class="table-cell">{linked_workflow_data.ponderation_theory}</div>,
                    <div class="table-cell">{linked_workflow_data.ponderation_practical}</div>,
                    <div class="table-cell">{linked_workflow_data.ponderation_individual}</div>,
                    <div class="table-cell">{linked_workflow_data.ponderation_theory+
                    linked_workflow_data.ponderation_practical+
                    linked_workflow_data.ponderation_individual}</div>,
                    <div class="table-cell" titletext={this.props.renderer.time_choices[linked_workflow_data.time_units].name}>{linked_workflow_data.time_required}</div>,
                ]
            )
        }else{
            return(
                [
                    <div titletext={gettext("No linked workflow")} class="table-cell">-</div>,
                    <div titletext={gettext("No linked workflow")} class="table-cell">-</div>,
                    <div titletext={gettext("No linked workflow")} class="table-cell">-</div>,
                    <div titletext={gettext("No linked workflow")} class="table-cell"></div>,
                    <div titletext={gettext("No linked workflow")} class="table-cell">-</div>,
                    <div titletext={gettext("No linked workflow")} class="table-cell">-</div>,
                    <div titletext={gettext("No linked workflow")} class="table-cell">-</div>,
                    <div titletext={gettext("No linked workflow")} class="table-cell">-</div>,
                ]
            )
        }
    }
    
}
const mapNodeStateToProps = (state,own_props)=>({
    data:getNodeByID(state,own_props.objectID).data,
    outcomes_type:state.workflow.outcomes_type
})
export const MatrixNodeView = connect(
    mapNodeStateToProps,
    null
)(MatrixNodeViewUnconnected)

class MatrixOutcomeBlockView extends React.Component{
    constructor(props){
        super(props);
        this.objectType="outcome";
        this.state={descendant_completion_status:{}}
    }
    
    render(){
        let children;
        let data = this.props.data;
        if(data.children) children = data.children.map(outcome=>
            <MatrixOutcomeBlockView renderer={this.props.renderer} nodeID={this.props.nodeID} data={outcome} descendant_completion_status={this.state.descendant_completion_status} updateParentCompletion={this.childUpdatedFunction.bind(this)} outcomes_type={this.props.outcomes_type} dropped_list={this.props.dropped_list}/>
        )
        let class_name="outcome-block";
        if(this.props.dropped_list.indexOf(data.id)>=0)class_name+=" dropped";
        return(
            <div class={class_name}>
                <TableOutcomeNode renderer={this.props.renderer} nodeID={this.props.nodeID} outcomeID={data.id} descendant_completion_status={this.state.descendant_completion_status} updateParentCompletion={this.childUpdatedFunction.bind(this)} outcomes_type={this.props.outcomes_type}/>
                <div class="outcome-block-children">
                    {children}
                </div>
            </div>
        );
        
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

