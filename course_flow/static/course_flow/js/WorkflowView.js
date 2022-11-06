import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON, WorkflowTitle} from "./ComponentJSON";
import ColumnWorkflowView from "./ColumnWorkflowView";
import WeekWorkflowView from "./WeekWorkflowView";
import {NodeBarColumnWorkflow} from "./ColumnWorkflowView";
import {NodeBarWeekWorkflow} from "./WeekWorkflowView";
import {WorkflowForMenu,renderMessageBox,closeMessageBox} from "./MenuComponents";
import * as Constants from "./Constants";
import {moveColumnWorkflow, moveWeekWorkflow, toggleObjectSet} from "./Reducers";
import {OutcomeBar} from "./OutcomeEditView";
import StrategyView from "./Strategy";
import WorkflowOutcomeView from "./WorkflowOutcomeView";
import WorkflowLegend from "./WorkflowLegend";
import {WorkflowOutcomeLegend} from "./WorkflowLegend";
import {getParentWorkflowInfo,insertedAt,restoreSelf,deleteSelf,getExport} from "./PostFunctions";
import OutcomeEditView from './OutcomeEditView';
import AlignmentView from './AlignmentView';
import CompetencyMatrixView from './CompetencyMatrixView';
import GridView from './GridView';


//Container for common elements for workflows
class WorkflowBaseViewUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="workflow";
        this.allowed_tabs=[0,1,2,3];
        this.exportDropDown = React.createRef();
        this.importDropDown = React.createRef();
    }
    
    render(){
        let data = this.props.data;
        let renderer = this.props.renderer;
        let read_only = renderer.read_only;
        let selection_manager = renderer.selection_manager;
        
        var selector = this;
        let publish_icon = iconpath+'view_none.svg';
        let publish_text = gettext("PRIVATE");
        if(data.published){
            publish_icon = iconpath+'published.svg';
            publish_text = gettext("PUBLISHED");
        }
        let share;
        if(!read_only)share = <div id="share-button" class="floatbardiv" onClick={renderMessageBox.bind(this,data,"share_menu",closeMessageBox)}><img src={iconpath+"add_person.svg"}/><div>{gettext("Sharing")}</div></div>
        
        let public_view;
        if(renderer.can_view && data.public_view){
            if(renderer.public_view){
                public_view=(
                    <a id="public-view" class="menu-create hover-shade hide-print" href={update_path.workflow.replace("0",data.id)}>
                        {gettext("Editable Page")}
                    </a>
                );
            }else{
                public_view=(
                    <a id="public-view" class="menu-create hover-shade hide-print" href={public_update_path.workflow.replace("0",data.id)}>
                        {gettext("Public Page")}
                    </a>
                );
            }
        }

        let workflow_content;
        if(renderer.view_type=="outcometable"){
            workflow_content=(
                <WorkflowView_Outcome renderer={renderer} view_type={renderer.view_type}/>
            );
            this.allowed_tabs=[1];
        }
        else if(renderer.view_type=="competencymatrix"){
            workflow_content=(
                <CompetencyMatrixView renderer={renderer} view_type={renderer.view_type}/>
            );
            this.allowed_tabs=[];
        }
        else if(renderer.view_type=="outcomeedit"){
            workflow_content=(
                <OutcomeEditView renderer={renderer}/>
            );
            if(data.type=="program")this.allowed_tabs=[];
            else this.allowed_tabs=[2,4];
        }
        else if(renderer.view_type=="horizontaloutcometable"){
            workflow_content=(
                <WorkflowView_Outcome renderer={renderer} view_type={renderer.view_type}/>
            );
            this.allowed_tabs=[1];
        }
        else if(renderer.view_type=="alignmentanalysis"){
            workflow_content=(
                <AlignmentView renderer={renderer} view_type={renderer.view_type}/>
            );
            this.allowed_tabs=[];
        }
        else if(renderer.view_type=="grid"){
            workflow_content=(
                <GridView renderer={renderer} view_type={renderer.view_type}/>
            );
            this.allowed_tabs=[];
        }
        else{
            workflow_content = (
                <WorkflowView renderer={renderer}/>
            );
            this.allowed_tabs=[1,2,3,4];
        }
        
        
        let view_buttons = [
            {type:"workflowview",name:gettext("Workflow View"),disabled:[]},
            {type:"outcomeedit",name:Constants.capWords(gettext("View")+" "+gettext(data.type+" outcomes")),disabled:[]},
            {type:"outcometable",name:Constants.capWords(gettext(data.type+" outcome")+" "+ gettext("Table")),disabled:[]},
            {type:"alignmentanalysis",name:Constants.capWords(gettext(data.type+" outcome")+" "+gettext("Analytics")),disabled:["activity"]},
            {type:"competencymatrix",name:Constants.capWords(gettext(data.type+" outcome")+" "+gettext("Evaluation Matrix")),disabled:["activity", "course"]},
            {type:"grid",name:gettext("Grid View"),disabled:["activity", "course"]},
            //{type:"horizontaloutcometable",name:gettext("Alignment Table"),disabled:["activity"]}
        ].filter(item=>item.disabled.indexOf(data.type)==-1).map(
            (item)=>{
                let view_class = "hover-shade";
                if(item.type==renderer.view_type)view_class += " active";
                //if(item.disabled.indexOf(data.type)>=0)view_class+=" disabled";
                return <div id={"button_"+item.type} class={view_class} onClick = {this.changeView.bind(this,item.type)}>{item.name}</div>;
            }
        );
        
        let view_buttons_sorted = view_buttons.slice(0,2);
        view_buttons_sorted.push(
            <div class="hover-shade other-views" onClick={()=>$(".views-dropdown")[0].classList.toggle("toggled")}>
                {gettext("Other Views")}
                <div class="views-dropdown">
                    {view_buttons.slice(2)}
                </div>
            </div>
        );

        let style={};
        if(data.lock){
            style.border="2px solid "+data.lock.user_colour;
        }    
    
        let workflow = this;

        let parent_workflow_indicator;
        if(!renderer.public_view)parent_workflow_indicator = (
            <ParentWorkflowIndicator workflow_id={data.id}/>
        )
            
        return(
            <div id="workflow-wrapper" class="workflow-wrapper">
                <div class="workflow-header" style={style}>
                    <WorkflowForMenu workflow_data={data} selectAction={this.openEdit.bind(this,null)}/>
                    {parent_workflow_indicator}
                    {public_view}
                </div>
                <div class="workflow-view-select hide-print">
                    {view_buttons_sorted}
                </div>
                <div class = "workflow-container">
                    {reactDom.createPortal(
                        <WorkflowTitle class_name="title-text" data={data}/>,
                        $("#workflowtitle")[0]
                    )}
                    {this.addEditable(data)}
                    {reactDom.createPortal(
                        share,
                        $("#floatbar")[0]
                    )}
                    {this.getExportButton()}
                    {this.getImportButton()}
                    {!read_only && reactDom.createPortal(
                        <div class="workflow-publication">
                            <img src={publish_icon}/><div>{publish_text}</div>
                        </div>,
                        $("#floatbar")[0]
                    )}
                    {!read_only && reactDom.createPortal(
                        <div class="hover-shade" id="edit-project-button" onClick ={ this.openEdit.bind(this)}>
                            <img src={iconpath+'edit_pencil.svg'} title={gettext("Edit Workflow")}/>
                        </div>,
                        $("#viewbar")[0]
                    )}
                    
                    {workflow_content}
                    
                    {!read_only &&
                        <NodeBar view_type={renderer.view_type} renderer={this.props.renderer}/>
                    }
                    {!data.is_strategy &&
                        <OutcomeBar renderer={this.props.renderer}/>
                    }
                    {!read_only && !data.is_strategy && data.type != "program" &&
                        <StrategyBar/>
                    }
                    {!read_only && 
                        <RestoreBar renderer={this.props.renderer}/>
                    }
                    {!data.is_strategy &&
                        <ViewBar renderer={this.props.renderer}/>
                    }
                </div>
            </div>
        
        );
    }
                     
    postMountFunction(){
        this.updateTabs();    
        window.addEventListener("click",(evt)=>{
            if($(evt.target).closest(".other-views").length==0){
                $(".views-dropdown").removeClass("toggled");
            }
        });
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
        this.props.renderer.selection_manager.changeSelection(null,null);
        this.props.renderer.render(this.props.renderer.container,type);
    }
                     
    openEdit(evt){
        this.props.renderer.selection_manager.changeSelection(evt,this);
    }
       
    getExportButton(){
        if(this.props.renderer.is_student && !this.props.renderer.can_view)return null;
        let export_button = (
            <div id="export-button" class="floatbardiv hover-shade" onClick={()=>renderMessageBox({...this.props.data,object_sets:this.props.object_sets},"export",closeMessageBox)}><img src={iconpath+"download.svg"}/><div>{gettext("Export")}</div>
            </div>
            
        );
        return (
            reactDom.createPortal(
                export_button,
                $("#floatbar")[0]
            )
        );
    }
                     
//    getExportButton(){
//        let exports=[];
//        this.pushExport(exports,"outcomes_excel",gettext("Outcomes to .xls"));
//        this.pushExport(exports,"outcomes_csv",gettext("Outcomes to .csv"));
//        if(this.props.data.type=="course")this.pushExport(exports,"frameworks_excel",gettext("Framework to .xls"));
//        if(this.props.data.type=="program")this.pushExport(exports,"matrix_excel",gettext("Matrix to .xls"));
//        if(this.props.data.type=="program")this.pushExport(exports,"matrix_csv",gettext("Matrix to .csv"));
//        this.pushExport(exports,"nodes_csv",gettext("Nodes to .csv"));
//        this.pushExport(exports,"nodes_excel",gettext("Nodes to .xls"));
//        
//        
//        let export_button = (
//            <div id="export-button" class="floatbardiv hover-shade" onClick={()=>$(this.exportDropDown.current).toggleClass("active")}><img src={iconpath+"download.svg"}/><div>{gettext("Export")}</div>
//                <div class="create-dropdown" ref={this.exportDropDown}>
//                    {exports}
//                </div>
//            </div>
//            
//        )
//        
//        return (
//            reactDom.createPortal(
//                export_button,
//                $("#floatbar")[0]
//            )
//        )
//    }
//                     
//    pushExport(exports,export_type,text){
//        exports.push(
//            <a class="hover-shade" onClick={this.clickExport.bind(this,export_type)}>
//                {text}
//            </a>
//        )
//    }
//                     
//    clickExport(export_type,evt){
//        evt.preventDefault();
//        getExport(this.props.data.id,"workflow",export_type,()=>alert(gettext("Your file is being generated and will be emailed to you shortly.")))
//    }
                     
    getImportButton(){
        if(this.props.renderer.read_only)return null;
        let disabled;
        if(this.props.data.importing)disabled=true;
        let imports=[];
        this.pushImport(imports,"outcomes",gettext("Import Outcomes"),disabled);
        this.pushImport(imports,"nodes",gettext("Import Nodes"),disabled);
        
        let button_class = "floatbardiv hover-shade";
        if(disabled)button_class+=" disabled";
        let import_button = (
            <div id="import-button" class={button_class} onClick={()=>$(this.importDropDown.current).toggleClass("active")}><img src={iconpath+"upload.svg"}/><div>{gettext("Import")}</div>
                <div class="create-dropdown" ref={this.importDropDown}>
                    {imports}
                </div>
            </div>
            
        )
        
        return (
            reactDom.createPortal(
                import_button,
                $("#floatbar")[0]
            )
        )
    }
                     
    pushImport(imports,import_type,text,disabled){
        let a_class = "hover-shade";
        if(disabled)a_class=" disabled";
        imports.push(
            <a class={a_class} onClick={this.clickImport.bind(this,import_type)}>
                {text}
            </a>
        )
    }
                     
    clickImport(import_type,evt){
        evt.preventDefault();
        renderMessageBox({"object_id":this.props.data.id,"object_type":this.objectType,import_type:import_type},"import",()=>{closeMessageBox()});
    }
    
}
const mapWorkflowStateToProps = state=>({
    data:state.workflow,
    object_sets:state.objectset,
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
            <WeekWorkflowView condensed={data.condensed} key={weekworkflow} objectID={weekworkflow} parentID={data.id} renderer={renderer}/>
        );
        
        
        
        return(
            <div class="workflow-details">
                {reactDom.createPortal(
                <div class="topdropwrapper hover-shade" title={gettext("Show/Hide Legend")}>
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
        this.makeDragAndDrop();
        
        
    }

    componentDidUpdate(){
        this.makeDragAndDrop();
    }

    makeDragAndDrop(){
        this.makeSortableNode(
            $(".column-row").children(".column-workflow").not(".ui-draggable"),
            this.props.objectID,
            "columnworkflow",
            ".column-workflow",
            "x",
            false,
            null,
            ".column",
            ".column-row"
        );
        this.makeSortableNode(
            $(".week-block").children(".week-workflow").not(".ui-draggable"),
            this.props.objectID,
            "weekworkflow",
            ".week-workflow",
            "y",
            false,
            null,
            ".week",
            ".week-block"
        );
    }

    stopSortFunction(){
        Constants.triggerHandlerEach($(".week .node"),"component-updated");
    }
    
    
    sortableMovedFunction(id,new_position,type,new_parent,child_id){
        if(type=="columnworkflow"){
            this.props.renderer.micro_update(moveColumnWorkflow(id,new_position,new_parent,child_id));
            insertedAt(this.props.renderer,child_id,"column",new_parent,"workflow",new_position,"columnworkflow");
        }
        if(type=="weekworkflow"){
            this.props.renderer.micro_update(moveWeekWorkflow(id,new_position,new_parent,child_id));
            insertedAt(this.props.renderer,child_id,"week",new_parent,"workflow",new_position,"weekworkflow");
        }
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


class ViewBarUnconnected extends ComponentJSON{
     
    render(){
        let sets=(
            <div class="node-bar-sort-block">
                {this.props.object_sets.sort((a,b)=>{
                    let x = a.term;
                    let y = b.term;
                    if(x<y)return -1;
                    if(x>y)return 1;
                    return 0;
                }).map((set)=>
                    <div><input type="checkbox" id={"set"+set.id} value={set.id} checked={(!set.hidden)} onChange={this.toggleHidden.bind(this,set.id,(!set.hidden))}/><label for={"set"+set.id}>{set.title}</label></div>

                )}
            </div>
        );
        return reactDom.createPortal(
            <div id="node-bar-workflow" class="right-panel-inner">
                <h4>{gettext("Object Sets")+":"}</h4>
                {sets}
            </div>
        ,$("#view-bar")[0]);
    }
    
    toggleHidden(id,hidden){
        this.props.dispatch(toggleObjectSet(id,hidden));
    }
}
export const ViewBar =  connect(
    (state)=>({object_sets:state.objectset}),
    null
)(ViewBarUnconnected)


class NodeBarUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="workflow";
    }
    
    
    render(){
        let data = this.props.data;
        
        
        if(this.props.renderer.view_type=="outcometable"||this.props.renderer.view_type=="horizontaloutcometable"){
            sort_type=(
                <div class="node-bar-sort-block">
                    {this.props.renderer.outcome_sort_choices.map((choice)=>
                        <div><input type="radio" id={"sort_type_choice"+choice.type} name="sort_type" value={choice.type} checked={(data.outcomes_sort==choice.type)} onChange={this.inputChanged.bind(this,"outcomes_sort")}/><label for={"sort_type_choice"+choice.type}>{choice.name}</label></div>

                    )}
                </div>
            );
            return reactDom.createPortal(
                <div id="node-bar-workflow" class="right-panel-inner">
                    <h4>Sort Nodes:</h4>
                    {sort_type}
                </div>
            ,$("#node-bar")[0]);
        }
        
        
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
        
        
        
        
        return reactDom.createPortal(
            <div id="node-bar-workflow" class="right-panel-inner">
                <h4 class="drag-and-drop">{gettext("Nodes")}:</h4>
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

class RestoreBarUnconnected extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType="workflow";
    }
    
    
    render(){
        let columns = this.props.columns.map((column)=>
            <RestoreBarItem objectType="column" data={column} renderer={this.props.renderer}/>
        )
        let weeks = this.props.weeks.map((week)=>
            <RestoreBarItem objectType="week" data={week} renderer={this.props.renderer}/>
        )
        let nodes = this.props.nodes.map((node)=>
            <RestoreBarItem objectType="node" data={node} renderer={this.props.renderer}/>
        )
        let outcomes = this.props.outcomes.map((outcome)=>
            <RestoreBarItem objectType="outcome" data={outcome} renderer={this.props.renderer}/>
        )
        let nodelinks = this.props.nodelinks.map((nodelink)=>
            <RestoreBarItem objectType="nodelink" data={nodelink} renderer={this.props.renderer}/>
        )
        
        
        return reactDom.createPortal(
            <div id="restore-bar-workflow" class="right-panel-inner">
                <h4>{gettext("Nodes")}:</h4>
                <div class="node-bar-column-block">
                    {nodes}
                </div>
                <h4>{gettext("Weeks")}:</h4>
                <div class="node-bar-column-block">
                    {weeks}
                </div>
                <h4>{gettext("Columns")}:</h4>
                <div class="node-bar-column-block">
                    {columns}
                </div>
                <h4>{gettext("Outcomes")}:</h4>
                <div class="node-bar-column-block">
                    {outcomes}
                </div>
                <h4>{gettext("Node Links")}:</h4>
                <div class="node-bar-column-block">
                    {nodelinks}
                </div>
            </div>
        ,$("#restore-bar")[0]);
    }
    
}
const mapRestoreBarStateToProps = state=>({
    weeks:state.week.filter(x=>x.deleted),
    columns:state.column.filter(x=>x.deleted),
    nodes:state.node.filter(x=>x.deleted),
    outcomes:state.outcome.filter(x=>x.deleted),
    nodelinks:state.nodelink.filter(x=>x.deleted),
    
})
export const RestoreBar = connect(
    mapRestoreBarStateToProps,
    null
)(RestoreBarUnconnected)

class RestoreBarItem extends React.Component{
    constructor(props){
        super(props);
        //The disabling prevents double clicks from sending two calls
        this.state={disabled:false};
    }
    
    render(){
        if(this.state.disabled)return null;
        else return (
            <div class="restore-bar-item">
                <div>{this.getTitle()}</div>
                <div class="workflow-created">{gettext("Deleted")+" "+this.props.data.deleted_on}</div>
                <button onClick={this.restore.bind(this)}>{gettext("Restore")}</button>
                <button onClick={this.delete.bind(this)}>{gettext("Permanently Delete")}</button>
            </div>
        );
    }

    getTitle(){
        if(this.props.data.title && this.props.data.title !== "")return this.props.data.title;
        if(this.props.objectType=="node" && (this.props.data.represents_workflow && this.props.data.linked_workflow_data.title && this.props.data.linked_workflow_data.title !== ""))return this.props.data.linked_workflow_data.title;
        return gettext("Untitled");
    }
    
    restore(){
        this.setState({disabled:true});
        this.props.renderer.tiny_loader.startLoad();
        restoreSelf(this.props.data.id,this.props.objectType,()=>{
            this.props.renderer.tiny_loader.endLoad();
        });
    }

    delete(){
        this.setState({disabled:true});
        if(window.confirm(gettext("Are you sure you want to permanently delete this object?"))){
            this.props.renderer.tiny_loader.startLoad();
            deleteSelf(this.props.data.id,this.props.objectType,false,()=>{
                this.props.renderer.tiny_loader.endLoad();
            });
        }
    }
}

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
                <h4 class="drag-and-drop">{gettext("My Strategies")}:</h4>
                <div class="strategy-bar-strategy-block">
                    {strategies}
                </div>
                {(saltise_strategies.length>0) &&
                    [<h4 class="drag-and-drop">{gettext("SALTISE Strategies")}:</h4>,
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
                    <div class="topdropwrapper hover-shade" title={gettext("Show/Hide Legend")}>
                        <img src={iconpath+"show_legend.svg"} onClick={this.toggleLegend.bind(this)}/>
                    </div>,
                    $("#viewbar")[0]
                )}
                {this.state.show_legend && 
                    <WorkflowOutcomeLegend renderer={renderer} toggle={this.toggleLegend.bind(this)}/>
                }
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
export const WorkflowView_Outcome = connect(
    mapWorkflowStateToProps,
    null
)(WorkflowView_Outcome_Unconnected)

class ParentWorkflowIndicatorUnconnected extends React.Component{
    
    constructor(props){
        super(props);
        this.state={};
    }
    
    render(){
        if(this.state.has_loaded){
            let parent_workflows = this.state.parent_workflows.map(parent_workflow=>
                <a href={update_path["workflow"].replace("0",parent_workflow.id)} class="panel-favourite">
                    {parent_workflow.title || gettext("Unnamed workflow")}
                </a>
            );
            let child_workflows = this.props.child_workflows.map(child_workflow=>
                <a href={update_path["workflow"].replace("0",child_workflow.id)} class="panel-favourite">
                    {child_workflow.title || gettext("Unnamed workflow")}
                </a>
            );
            let return_val=[
                <hr/>,
                <a class="panel-item">{gettext("Quick Navigation")}</a>
            ]
            if(parent_workflows.length>0)return_val.push(
                <a class="panel-item">{gettext("Used in:")}</a>,
                ...parent_workflows
            );
            if(child_workflows.length>0)return_val.push(
                <a class="panel-item">{gettext("Workflows Used:")}</a>,
                ...child_workflows
            );
            return reactDom.createPortal(
                return_val,
                $(".left-panel-extra")[0]
            );
            
        }
        
        
        return null;
    }
    
    componentDidMount(){
        getParentWorkflowInfo(this.props.workflow_id,response_data=>
            this.setState({parent_workflows:response_data.parent_workflows,has_loaded:true})
        );
    }


    getTypeIndicator(data){
        let type=data.type
        let type_text = gettext(type);
        if(data.is_strategy)type_text+=gettext(" strategy");
        return (
            <div class={"workflow-type-indicator "+type}>{type_text}</div>
        );
    }
}
const mapParentWorkflowIndicatorStateToProps = state => ({
    child_workflows:state.node.filter(node=>node.linked_workflow_data).map(node => ({
        id:node.linked_workflow,
        title:node.linked_workflow_data.title,
        description:node.linked_workflow_data.description
    }))
});
export const ParentWorkflowIndicator = connect(
    mapParentWorkflowIndicatorStateToProps,
    null
)(ParentWorkflowIndicatorUnconnected)




