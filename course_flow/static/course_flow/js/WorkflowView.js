import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON} from "./ComponentJSON.js";
import ColumnWorkflowView from "./ColumnWorkflowView.js";
import WeekWorkflowView from "./WeekWorkflowView.js";
import {NodeBarColumnWorkflow} from "./ColumnWorkflowView.js";
import {NodeBarWeekWorkflow} from "./WeekWorkflowView.js";
import {WorkflowForMenu} from "./MenuComponents.js";
import * as Constants from "./Constants.js";
import {moveColumnWorkflow, moveWeekWorkflow} from "./Reducers.js";
import {OutcomeBar} from "./OutcomeTopView.js";
import StrategyView from "./Strategy.js";
import WorkflowOutcomeView from "./WorkflowOutcomeView.js";
import WorkflowLegend from "./WorkflowLegend.js";
import {WorkflowOutcomeLegend} from "./WorkflowLegend.js";



//Basic component representing the workflow
class WorkflowView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="workflow";
        this.state={};
    }
    
    render(){
        let data = this.props.data;
        var columnworkflows = data.columnworkflow_set.map((columnworkflow)=>
            <ColumnWorkflowView key={columnworkflow} objectID={columnworkflow} parentID={data.id} selection_manager={this.props.selection_manager}/>
        );
        var weekworkflows = data.weekworkflow_set.map((weekworkflow)=>
            <WeekWorkflowView key={weekworkflow} objectID={weekworkflow} parentID={data.id} selection_manager={this.props.selection_manager}/>
        );
        var selector = this;
        
        
        
        return(
            <div id="workflow-wrapper" class="workflow-wrapper">
                <div class = "workflow-container">
                    <div class="workflow-details">
                        <WorkflowForMenu workflow_data={data} selected={this.state.selected} selectAction={(evt)=>{this.props.selection_manager.changeSelection(evt,selector)}}/>
                        {this.addEditable(data)}
                        {reactDom.createPortal(
                        <div class="topdropwrapper" title="Show/Hide Legend">
                            <img src={iconpath+"show_legend.svg"} onClick={this.toggleLegend.bind(this)}/>
                        </div>,
                        $("#viewbar")[0]
                        )}
                        {this.state.show_legend && 
                            <WorkflowLegend toggle={this.toggleLegend.bind(this)}/>
                        }
                        <div class="column-row">
                            {columnworkflows}
                        </div>
                        <div class="week-block">
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
                    {!read_only &&
                        <NodeBar/>
                    }
                    {!read_only && !data.is_strategy &&
                        <OutcomeBar/>
                    }
                    {!read_only && !data.is_strategy && data.type != "program" &&
                        <StrategyBar/>
                    }
                </div>
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
    
    
    sortableMovedFunction(id,new_position,type){
        if(type=="columnworkflow")this.props.dispatch(moveColumnWorkflow(id,new_position))
        if(type=="weekworkflow")this.props.dispatch(moveWeekWorkflow(id,new_position))
    }
                     
    toggleLegend(){
        if(this.state.show_legend){
            this.setState({show_legend:false});
        }else{
            this.setState({show_legend:true});
        }
    }
}
const mapWorkflowStateToProps = state=>({
    data:state.workflow
})
const mapWorkflowDispatchToProps = {};
export default connect(
    mapWorkflowStateToProps,
    null
)(WorkflowView)



class NodeBarUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="workflow";
    }
    
    
    render(){
        let data = this.props.data;
        var nodebarcolumnworkflows = data.columnworkflow_set.map((columnworkflow)=>
            <NodeBarColumnWorkflow key={columnworkflow} objectID={columnworkflow}/>
        );
        var columns_present = this.props.columns.map(col=>col.column_type);
        for(var i=0;i<data.DEFAULT_COLUMNS.length;i++){
            if(columns_present.indexOf(data.DEFAULT_COLUMNS[i])<0){
                nodebarcolumnworkflows.push(
                    <NodeBarColumnWorkflow key={"default"+i} columnType={data.DEFAULT_COLUMNS[i]}/>
                )
            }
        }
        nodebarcolumnworkflows.push(
            <NodeBarColumnWorkflow key={"default"+i} columnType={data.DEFAULT_CUSTOM_COLUMN}/>
        )
        
        
        var nodebarweekworkflows;
        if(!this.props.outcomes_view)nodebarweekworkflows= data.weekworkflow_set.map((weekworkflow)=>
            <NodeBarWeekWorkflow key={weekworkflow} objectID={weekworkflow}/>
        );
        var sort_type;
        if(this.props.outcomes_view)sort_type=(
            <div class="node-bar-sort-block">
                <p>Sort Nodes By:</p>
                {outcome_sort_choices.map((choice)=>
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
        
        return(
            <div id="workflow-wrapper" class="workflow-wrapper">
                <div class = "workflow-container">
                    <div class="workflow-details">
                        <WorkflowForMenu workflow_data={data} selected={this.state.selected} selectAction={(evt)=>{this.props.selection_manager.changeSelection(evt,selector)}}/>
                        {this.addEditable(data)}
                        {reactDom.createPortal(
                        <div class="topdropwrapper" title="Show/Hide Legend">
                            <img src={iconpath+"show_legend.svg"} onClick={this.toggleLegend.bind(this)}/>
                        </div>,
                        $("#viewbar")[0]
                        )}
                        {this.state.show_legend && 
                            <WorkflowOutcomeLegend toggle={this.toggleLegend.bind(this)}/>
                        }
                        <WorkflowOutcomeView selection_manager={this.props.selection_manager} outcomes_type={data.outcomes_type}/>
                    </div>
                    {!read_only &&
                        <NodeBar outcomes_view={true}/>
                    }
                    {!read_only &&
                        <OutcomeBar outcomes_view={true}/>
                    }
                </div>
            </div>
        );
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



