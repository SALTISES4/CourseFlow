import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {Component, EditableComponentWithComments, OutcomeTitle, TitleText, NodeTitle} from "./ComponentJSON";
import * as Constants from "./Constants";
import {getOutcomeByID, getWeekWorkflowByID, getWeekByID, getNodeWeekByID, getNodeByID, getOutcomeNodeByID, getTableOutcomeNodeByID} from "./FindState";
import {TableOutcomeNode} from "./OutcomeNode";
import {WorkflowOutcomeLegend} from "./WorkflowLegend";


//Creates a competency matrix. Probably should only be active at the program level.
class CompetencyMatrixView extends Component{
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
            let outcomes = this.props.outcomes_tree.map(category=>{
                let category_outcomes = category.outcomes.map((outcome)=>
                    <MatrixOutcomeView renderer={this.props.renderer} tree_data={outcome} objectID={outcome.id} dropped_list={this.state.dropped_list}/>
                );
                
                if(this.props.object_sets.length>0)return [
                    <div class="table-cell nodewrapper">
                        <div class="outcome">
                            <h4>{category.title}</h4>
                        </div>
                    </div>
                ,
                ...category_outcomes];
                else return category_outcomes;
            });
            
            
            let weekworkflows = data.weekworkflow_set.map((weekworkflow,i)=>
                <MatrixWeekWorkflowView renderer={this.props.renderer} objectID={weekworkflow} rank={i} outcomes_tree={this.props.outcomes_tree} dropped_list={this.state.dropped_list}/>                                         
            );
            
            return(
                <div class="workflow-details">
                    <WorkflowOutcomeLegend renderer={this.props.renderer} outcomes_type={data.outcomes_type}/>
                    <div ref={this.maindiv} class="outcome-table competency-matrix">
                        <div class="outcome-row node-row">
                            <div class="outcome-head empty"></div>
                            <div class="table-cell nodewrapper blank"><div class="outcome"></div></div>
                            <div class="outcome-cells">{outcomes}</div>
                            <div class="table-cell nodewrapper"><div class="outcome"><h4>{gettext("Hours")}</h4></div></div>
                            <div class="table-cell nodewrapper"><div class="outcome">{gettext("General Education")}</div></div>
                            <div class="table-cell nodewrapper"><div class="outcome">{gettext("Specific Education")}</div></div>
                            <div class="table-cell nodewrapper"><div class="outcome">{gettext("Total Hours")}</div></div>
                            <div class="table-cell nodewrapper"><div class="outcome"><h4>{gettext("Ponderation")}</h4></div></div>
                            <div class="table-cell nodewrapper"><div class="outcome">{gettext("Theory")}</div></div>
                            <div class="table-cell nodewrapper"><div class="outcome">{gettext("Practical")}</div></div>
                            <div class="table-cell nodewrapper"><div class="outcome">{gettext("Individual Work")}</div></div>
                            <div class="table-cell nodewrapper"><div class="outcome">{gettext("Total")}</div></div>
                            <div class="table-cell nodewrapper"><div class="outcome">{gettext("Credits")}</div></div>
                        </div>
                        {weekworkflows}
                    </div>
                </div>
            );
        }
    }
    

    
    componentDidMount(){
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
    for(let i=0;i<outcomes_tree.length;i++){
        if(state.objectset.length>0)outcomes_ordered.push(null);
        Constants.flattenOutcomeTree(outcomes_tree[i].outcomes,outcomes_ordered);
    }
    return {workflow:state.workflow,outcomes_tree:outcomes_tree,outcomes_ordered:outcomes_ordered,object_sets:state.objectset};
}
export default connect(
    mapStateToProps,
    null
)(CompetencyMatrixView)

class MatrixOutcomeViewUnconnected extends EditableComponentWithComments{
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


        let comments;
        if(this.props.renderer.view_comments)comments=this.addCommenting();
        
        let onClick;
        onClick=(evt)=>this.props.renderer.selection_manager.changeSelection(evt,this);
        
        return (
            <div class={class_name}>
                <div class="table-cell nodewrapper" ref={this.maindiv}>
                    <div style={this.get_border_style()} class="outcome" onClick={onClick}>
                        <OutcomeTitle data={data}  prefix={this.props.prefix} hovertext={this.props.hovertext}/>
                        {children.length>0 && 
                            <div class="outcome-drop" onClick={this.toggleDrop.bind(this)}>
                                <div class = "outcome-drop-img">
                                    <img src={iconpath+dropIcon+".svg"}/>
                                </div>
                            </div>
                        }
                        <div class="mouseover-actions">
                            {comments}
                        </div>
                        {this.addEditable(data,true)}
                    </div>
                    <div class="side-actions">
                        <div class="comment-indicator-container"></div>
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

class MatrixWeekWorkflowViewUnconnected extends React.Component{
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

class MatrixWeekViewUnconnected extends EditableComponentWithComments{
    constructor(props){
        super(props);
        this.objectType="week";
    }
    
    render(){
        let data = this.props.data;
        
        let default_text = data.week_type_display+" "+(this.props.rank+1);
        
        let nodes = this.props.nodes.map(node=>
            <MatrixNodeView outcomes_tree={this.props.outcomes_tree} renderer={this.props.renderer} objectID={node.id} dropped_list={this.props.dropped_list}/>
        )
        
        let comments;
        if(this.props.renderer.view_comments)comments=this.addCommenting();
        
        let outcomecells = this.props.outcomes_tree.map(category=>{
            let categories = category.outcomes.map(outcome=>
                <MatrixWeekOutcomeBlockView renderer={this.props.renderer} data={outcome} dropped_list={this.props.dropped_list}/>
            )
            if(this.props.object_sets.length>0)return [
                <div class="table-cell"></div>,
                ...categories
            ];
            else return categories;
        });
        
        return (
            <div class="week">
                <div class="node-row">
                    <div onClick={(evt)=>this.props.renderer.selection_manager.changeSelection(evt,this)} ref={this.maindiv} class="outcome-head" style={this.get_border_style()}>
                        <TitleText title={data.title} defaultText={default_text}/>
                        <div class="mouseover-actions">
                            {comments}
                        </div>
                        <div class="side-actions">
                            <div class="comment-indicator-container"></div>
                        </div>
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
                {nodes}
                {this.addEditable(data,true)}
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

//class MatrixNodeWeekViewUnconnected extends React.Component{
//    constructor(props){
//        super(props);
//        this.objectType="nodeweek";
//    }
//    
//    render(){
//        let data = this.props.data;
//        
//        return (
//            <MatrixNodeView outcomes_tree={this.props.outcomes_tree} renderer={this.props.renderer} objectID={data.node} dropped_list={this.props.dropped_list}/>
//        )
//    }
//    
//}
//const mapNodeWeekStateToProps = (state,own_props)=>(
//    getNodeWeekByID(state,own_props.objectID)
//)
//export const MatrixNodeWeekView = connect(
//    mapNodeWeekStateToProps,
//    null
//)(MatrixNodeWeekViewUnconnected)

class MatrixNodeViewUnconnected extends EditableComponentWithComments{
    constructor(props){
        super(props);
        this.objectType="node";
    }
    
    render(){
        let data = this.props.data;
        let data_override;
        if(data.represents_workflow)data_override = {...data,...data.linked_workflow_data}
        else data_override = data;
        let selection_manager = this.props.renderer.selection_manager;
        
        
        let css_class="node column-"+data.column+" "+Constants.node_keys[data.node_type];
        if(data.is_dropped)css_class+=" dropped";
        if(data.lock)css_class+=" locked locked-"+data.lock.user_id;
        
        let style = this.get_border_style();
        style.backgroundColor=Constants.getColumnColour(this.props.column)
        
        let comments;
        if(this.props.renderer.view_comments)comments=this.addCommenting();
        
        let outcomenodes = this.props.outcomes_tree.map(category=>{
            let categories = category.outcomes.map(outcome=>
                <MatrixOutcomeBlockView renderer={this.props.renderer} nodeID={data.id} data={outcome} outcomes_type={this.props.outcomes_type} dropped_list={this.props.dropped_list}/>
            )
            if(this.props.object_sets.length>0)return [
                <div class="table-cell"></div>,
                ...categories
            ];
            else return categories;
        })
        
        return (
            <div class="node-row">
                <div class="outcome-head">
                    <div class={css_class}
                        style={style}
                        id={data.id} 
                        ref={this.maindiv} 
                        onClick={(evt)=>selection_manager.changeSelection(evt,this)}
                    >
                        <div class = "node-top-row">
                            <NodeTitle data={data}/>
                        </div>
                        <div class="mouseover-actions">
                            {comments}
                        </div>
                        <div class="side-actions">
                            <div class="comment-indicator-container"></div>
                        </div>
                    </div>
                </div>
                <div class="table-cell blank"></div>
                {outcomenodes}
                <div class="table-cell blank"></div>
                {this.getTimeData(data_override)}
                {this.addEditable(data_override,true)}
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
const mapNodeStateToProps = (state,own_props)=>({
    ...getNodeByID(state,own_props.objectID),
    outcomes_type:state.workflow.outcomes_type,
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

