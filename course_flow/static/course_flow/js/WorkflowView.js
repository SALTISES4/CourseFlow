import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON, TitleText} from "./ComponentJSON.js";
import ColumnWorkflowView from "./ColumnWorkflowView.js";
import WeekWorkflowView from "./WeekWorkflowView.js";
import {NodeBarColumnWorkflow} from "./ColumnWorkflowView.js";
import {NodeBarWeekWorkflow} from "./WeekWorkflowView.js";
import {WorkflowForMenu,renderMessageBox,closeMessageBox} from "./MenuComponents.js";
import * as Constants from "./Constants.js";
import {moveColumnWorkflow, moveWeekWorkflow} from "./Reducers.js";
import {OutcomeBar} from "./OutcomeEditView.js";
import StrategyView from "./Strategy.js";
import WorkflowOutcomeView from "./WorkflowOutcomeView.js";
import WorkflowLegend from "./WorkflowLegend.js";
import {WorkflowOutcomeLegend} from "./WorkflowLegend.js";
import OutcomeEditView from './OutcomeEditView';
import AlignmentView from './AlignmentView';


//Container for common elements for workflows
class WorkflowBaseViewUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="workflow";
        this.allowed_tabs=[0,1,2,3];
    }
    
    render(){
        let data = this.props.data;
        let renderer = this.props.renderer;
        let selection_manager = renderer.selection_manager;
        
        var selector = this;
        let publish_icon = iconpath+'view_none.svg';
        let publish_text = "PRIVATE";
        if(data.published){
            publish_icon = iconpath+'published.svg';
            publish_text = "PUBLISHED";
        }
        let share;
        if(!read_only)share = <div id="share-button" class="floatbardiv" onClick={renderMessageBox.bind(this,data,"share_menu",closeMessageBox)}><img src={iconpath+"add_person.svg"}/><div>Sharing</div></div>
        let workflow_content;
        if(renderer.view_type=="outcometable"){
            workflow_content=(
                <WorkflowView_Outcome renderer={renderer} view_type={renderer.view_type}/>
            );
            this.allowed_tabs=[];
        }
        else if(renderer.view_type=="outcomeedit"){
            workflow_content=(
                <OutcomeEditView renderer={renderer}/>
            );
            if(data.type=="program")this.allowed_tabs=[];
            else this.allowed_tabs=[2];
        }
        else if(renderer.view_type=="horizontaloutcometable"){
            workflow_content=(
                <WorkflowView_Outcome renderer={renderer} view_type={renderer.view_type}/>
            );
            this.allowed_tabs=[];
        }
        else if(renderer.view_type=="alignmentanalysis"){
            workflow_content=(
                <AlignmentView renderer={renderer} view_type={renderer.view_type}/>
            );
            this.allowed_tabs=[];
        }
        else{
            workflow_content = (
                <WorkflowView renderer={renderer}/>
            );
            this.allowed_tabs=[1,2,3];
        }
        
        
        let view_buttons = [
            {type:"workflowview",name:"Workflow View",disabled:[]},
            {type:"outcomeedit",name:"Edit Outcomes",disabled:[]},
            {type:"outcometable",name:"Outcomes Table",disabled:[]},
            {type:"alignmentanalysis",name:"Outcome Analytics",disabled:["activity"]},
            {type:"horizontaloutcometable",name:"Alignment Table",disabled:["activity"]}
        ].map(
            (item)=>{
                let view_class = "hover-shade";
                if(item.type==renderer.view_type)view_class += " active";
                if(item.disabled.indexOf(data.type)>=0)view_class+=" disabled";
                return <div id={"button_"+item.type} class={view_class} onClick = {this.changeView.bind(this,item.type)}>{item.name}</div>;
            }
        );
            
            
        return(
            <div id="workflow-wrapper" class="workflow-wrapper">
                <div class="workflow-header">
                    <WorkflowForMenu workflow_data={data} selectAction={renderer.selection_manager.changeSelection.bind(this,null,this)}/>
                </div>
                <div class="workflow-view-select">
                    {view_buttons}
                </div>
                <div class = "workflow-container">
                    {reactDom.createPortal(
                        <div>{data.title||"Unnamed Workflow"}</div>,
                        $("#workflowtitle")[0]
                    )}
                    {this.addEditable(data)}
                    {reactDom.createPortal(
                        share,
                        $("#floatbar")[0]
                    )}
                    {reactDom.createPortal(
                        <div class="workflow-publication">
                            <img src={publish_icon}/><div>{publish_text}</div>
                        </div>,
                        $("#floatbar")[0]
                    )}
                    {!read_only &&
                        reactDom.createPortal(
                            <div class="hover-shade" id="edit-project-button" onClick ={ this.openEdit.bind(this)}>
                                <img src={iconpath+'edit_pencil.svg'} title="Edit Project"/>
                            </div>,
                            $("#viewbar")[0]
                        )
                    }
                    
                    {workflow_content}
                    
                    {!read_only &&
                        <NodeBar renderer={this.props.renderer}/>
                    }
                    {!read_only && !data.is_strategy &&
                        <OutcomeBar renderer={this.props.renderer}/>
                    }
                    {!read_only && !data.is_strategy && data.type != "program" &&
                        <StrategyBar/>
                    }
                </div>
            </div>
        
        );
    }
                     
    postMountFunction(){
        this.updateTabs();    
    }
                     
    componentDidUpdate(prev_props){
        if(prev_props.view_type!=this.props.view_type)this.updateTabs();
    }
                    
    updateTabs(){
        //If the view type has changed, enable only appropriate tabs, and change the selection to none
        this.props.renderer.selection_manager.changeSelection(null,null);
        let disabled_tabs=[];
        for(let i=0;i<4;i++)if(this.allowed_tabs.indexOf(i)<0)disabled_tabs.push(i);
        $("#sidebar").tabs({disabled:false});
        let current_tab = $("#sidebar").tabs("option","active");
        if(this.allowed_tabs.indexOf(current_tab)<0){
            if(this.allowed_tabs.length==0)$("#sidebar").tabs({active:false});
            else $("#sidebar").tabs({active:this.allowed_tabs[0]});
        }
        $("#sidebar").tabs({disabled:disabled_tabs});
    }
                     
    changeView(type){
        this.props.renderer.render(this.props.renderer.container,type);
    }
                     
    openEdit(evt){
        this.props.renderer.selection_manager.changeSelection(evt,this);
    }
    
}
const mapWorkflowStateToProps = state=>({
    data:state.workflow
})
const mapWorkflowDispatchToProps = {};
export const WorkflowBaseView = connect(
    mapWorkflowStateToProps,
    null
)(WorkflowBaseViewUnconnected)


//Basic component representing the workflow
class WorkflowViewUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="workflow";
        this.state={};
    }
    
    render(){
        let data = this.props.data;
        let renderer = this.props.renderer;
        var columnworkflows = data.columnworkflow_set.map((columnworkflow)=>
            <ColumnWorkflowView key={columnworkflow} objectID={columnworkflow} parentID={data.id} renderer={renderer}/>
        );
        var weekworkflows = data.weekworkflow_set.map((weekworkflow)=>
            <WeekWorkflowView key={weekworkflow} objectID={weekworkflow} parentID={data.id} renderer={renderer}/>
        );
        
        
        
        return(
            <div class="workflow-details">
                {reactDom.createPortal(
                <div class="topdropwrapper" title="Show/Hide Legend">
                    <img src={iconpath+"show_legend.svg"} onClick={this.toggleLegend.bind(this)}/>
                </div>,
                $("#viewbar")[0]
                )}
                {this.state.show_legend && 
                    <WorkflowLegend renderer={renderer} toggle={this.toggleLegend.bind(this)}/>
                }
                <div class="column-row" id={data.id+"-column-block"}>
                    {columnworkflows}
                </div>
                <div class="week-block" id={data.id+"-week-block"}>
                    {weekworkflows}
                </div>
                <svg class="workflow-canvas" width="100%" height="100%">
                    <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5"
                            markerWidth="4" markerHeight="4"
                            orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" />
                        </marker>
                    </defs>
                </svg>
            </div>
        );
    }
                     
    
                     
    postMountFunction(){
        this.makeSortable($(".column-row"),
          this.props.objectID,
          "columnworkflow",
          ".column-workflow",
          "x");
        if(!this.props.data.is_strategy)this.makeSortable($(".week-block"),
          this.props.objectID,
          "weekworkflow",
          ".week-workflow",
          "y");
    }

    stopSortFunction(){
        Constants.triggerHandlerEach($(".week .node"),"component-updated");
    }
    
    
    sortableMovedFunction(id,new_position,type,new_parent,child_id){
        if(type=="columnworkflow")this.props.dispatch(moveColumnWorkflow(id,new_position,new_parent,child_id))
        if(type=="weekworkflow")this.props.dispatch(moveWeekWorkflow(id,new_position,new_parent,child_id))
    }
                     
    toggleLegend(){
        if(this.state.show_legend){
            this.setState({show_legend:false});
        }else{
            this.setState({show_legend:true});
        }
    }
}
export const WorkflowView =  connect(
    mapWorkflowStateToProps,
    null
)(WorkflowViewUnconnected)



class NodeBarUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="workflow";
    }
    
    
    render(){
        let data = this.props.data;
        var nodebarcolumnworkflows = data.columnworkflow_set.map((columnworkflow)=>
            <NodeBarColumnWorkflow key={columnworkflow} renderer={this.props.renderer} objectID={columnworkflow}/>
        );
        var columns_present = this.props.columns.map(col=>col.column_type);
        for(var i=0;i<data.DEFAULT_COLUMNS.length;i++){
            if(columns_present.indexOf(data.DEFAULT_COLUMNS[i])<0){
                nodebarcolumnworkflows.push(
                    <NodeBarColumnWorkflow key={"default"+i} renderer={this.props.renderer} columnType={data.DEFAULT_COLUMNS[i]}/>
                )
            }
        }
        nodebarcolumnworkflows.push(
            <NodeBarColumnWorkflow key={"default"+i} renderer={this.props.renderer} columnType={data.DEFAULT_CUSTOM_COLUMN}/>
        )
        
        
        var nodebarweekworkflows;
        if(this.props.renderer.view_type=="workflowview")nodebarweekworkflows= data.weekworkflow_set.map((weekworkflow)=>
            <NodeBarWeekWorkflow key={weekworkflow} renderer={this.props.renderer} objectID={weekworkflow}/>
        );
        var sort_type;
        if(this.props.renderer.view_type=="outcometable"||this.props.renderer.view_type=="horizontaloutcometable")sort_type=(
            <div class="node-bar-sort-block">
                <p>Sort Nodes By:</p>
                {this.props.renderer.outcome_sort_choices.map((choice)=>
                    <span><input type="radio" id={"sort_type_choice"+choice.type} name="sort_type" value={choice.type} checked={(data.outcomes_sort==choice.type)} onChange={this.inputChanged.bind(this,"outcomes_sort")}/><label for={"sort_type_choice"+choice.type}>{choice.name}</label></span>
                    
                )}
            </div>
        );
        
        
        
        
        return reactDom.createPortal(
            <div id="node-bar-workflow" class="right-panel-inner">
                <h4 class="drag-and-drop">Nodes:</h4>
                <div class="node-bar-column-block">
                    {nodebarcolumnworkflows}
                </div>
                <div class="node-bar-week-block">
                    {nodebarweekworkflows}
                </div>
                {sort_type}
            </div>
        ,$("#node-bar")[0]);
    }
    
}
const mapNodeBarStateToProps = state=>({
    data:state.workflow,
    columns:state.column
})
export const NodeBar = connect(
    mapNodeBarStateToProps,
    null
)(NodeBarUnconnected)

class StrategyBarUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="workflow";
    }
    
    
    render(){
        
        var strategies = this.props.available_strategies.map((strategy)=>
            <StrategyView key={strategy.id} objectID={strategy.id} data={strategy}/>
        );
        var saltise_strategies = this.props.saltise_strategies.map((strategy)=>
            <StrategyView key={strategy.id} objectID={strategy.id} data={strategy}/>
        );
        
        
        
        return reactDom.createPortal(
            <div id="strategy-bar-workflow" class="right-panel-inner">
                <h4 class="drag-and-drop">My Strategies:</h4>
                <div class="strategy-bar-strategy-block">
                    {strategies}
                </div>
                {(saltise_strategies.length>0) &&
                    [<h4 class="drag-and-drop">SALTISE Strategies:</h4>,
                    <div class="strategy-bar-strategy-block">
                        {saltise_strategies}
                    </div>
                     ]
                }
            </div>
        ,$("#strategy-bar")[0]);
    }
    
}
const mapStrategyBarStateToProps = state=>({
    data:state.workflow,
    available_strategies:state.strategy,
    saltise_strategies:state.saltise_strategy,
})
export const StrategyBar = connect(
    mapStrategyBarStateToProps,
    null
)(StrategyBarUnconnected)


//Basic component representing the workflow
class WorkflowView_Outcome_Unconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="workflow";
        this.state={};
    }
    
    render(){
        let data = this.props.data;
        
        var selector = this;
        let renderer = this.props.renderer;
        let selection_manager = renderer.selection_manager;
        
        
        return(
            <div class="workflow-details">
                {reactDom.createPortal(
                    <div class="topdropwrapper" title="Show/Hide Legend">
                        <img src={iconpath+"show_legend.svg"} onClick={this.toggleLegend.bind(this)}/>
                    </div>,
                    $("#viewbar")[0]
                )}
                <WorkflowOutcomeView renderer={renderer} outcomes_type={data.outcomes_type}/>
            </div>
        );
    }
                     
    openEdit(evt){
        this.props.renderer.selection_manager.changeSelection(evt,this);
    }
                     
    toggleLegend(){
        if(this.state.show_legend){
            this.setState({show_legend:false});
        }else{
            this.setState({show_legend:true});
        }
    }
    
    
}
export const WorkflowView_Outcome =  connect(
    mapWorkflowStateToProps,
    null
)(WorkflowView_Outcome_Unconnected)



