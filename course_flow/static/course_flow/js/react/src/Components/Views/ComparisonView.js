import * as React from 'react';
import * as reactDom from 'react-dom';
import { Provider, connect } from 'react-redux';
import {
  Component,
  EditableComponent,
  EditableComponentWithSorting,
  WorkflowTitle
} from '../components/CommonComponents.js';
import * as Constants from '../../Constants.js';
import { Loader } from '../../UtilityFunctions.js';
import { renderMessageBox, closeMessageBox } from '../components/MenuComponents.js';
import {
  getWorkflowSelectMenu,
  getWorkflowContext,
  insertedAt,
  insertedAtInstant
} from '../../PostFunctions.js';
import { WeekWorkflowComparisonView } from './WeekWorkflowView.js';
import { getSortedOutcomesFromOutcomeWorkflowSet } from '../../FindState.js';
import { OutcomeEditViewUnconnected } from './OutcomeEditView.js';
import { toggleObjectSet, moveWeekWorkflow } from '../../Reducers.js';
import { WorkflowForMenu } from '../../Library.js'

//Container for the workflows to be compared
export class ComparisonView extends React.Component{

    constructor(props){
        super(props);
        this.objectType="workflow";
        this.allowed_tabs=[0,3];

        let querystring = window.location.search;
        let url_params = new URLSearchParams(querystring);
        let workflows_added = url_params.getAll("workflows").map(workflow_id=>parseInt(workflow_id));

        this.state = {workflows:workflows_added,object_sets:props.data.object_sets};
    }

    render(){
        let data = this.props.data;
        let renderer = this.props.renderer;
        let selection_manager = renderer.selection_manager;

        var selector = this;

        let share;
        if(!this.props.renderer.read_only)share = <div id="share-button" class="hover-shade" title={gettext("Sharing")} onClick={renderMessageBox.bind(this,data,"share_menu",closeMessageBox)}><img src={config.icon_path+"add_person.svg"}/></div>


        let view_buttons = [
            {type:"workflowview",name:gettext("Workflow View"),disabled:[]},
            {type:"outcomeedit",name:Constants.capWords(gettext("View")+" outcomes"),disabled:[]},
        ].filter(item=>item.disabled.indexOf(data.type)==-1).map(
            (item)=>{
                let view_class = "hover-shade";
                if(item.type==renderer.view_type)view_class += " active";
                //if(item.disabled.indexOf(data.type)>=0)view_class+=" disabled";
                return <div id={"button_"+item.type} class={view_class} onClick = {this.changeView.bind(this,item.type)}>{item.name}</div>;
            }
        );

        let view_buttons_sorted = view_buttons;

        let workflow_content=this.state.workflows.map(workflowID=>
            <WorkflowComparisonRendererComponent removeFunction={this.removeWorkflow.bind(this,workflowID)} view_type={renderer.view_type} workflowID={workflowID} key={workflowID} tiny_loader={this.props.tiny_loader} selection_manager={this.props.selection_manager} object_sets={this.state.object_sets}/>
        );
        let add_button = (
            <div>
                <button id="load-workflow" class="primary-button" onClick={this.loadWorkflow.bind(this)}>
                    <div class="flex-middle">
                        <span class="material-symbols-rounded filled">add_circle</span>
                        <div>{gettext("Load new workflow")}</div>
                    </div>
                </button>
            </div>
        );

        let style={};
        if(data.lock){
            style.border="2px solid "+data.lock.user_colour;
        }

        let project = this;

        return(
            <div id="workflow-wrapper" class="workflow-wrapper">
                {this.getHeader()}
                <div class="workflow-view-select hide-print">
                    {view_buttons_sorted}
                </div>
                <div class = "workflow-container comparison-view">
                    {reactDom.createPortal(
                        share,
                        $("#visible-icons")[0]
                    )}
                    <div class="workflow-array">
                        {workflow_content}
                    </div>
                    {add_button}

                    <ViewBar toggleObjectSet={this.toggleObjectSet.bind(this)} object_sets={this.state.object_sets} renderer={this.props.renderer}/>
                </div>
            </div>

        );
    }

    getHeader(){
        let data = this.props.data;
        return(
            <div class="project-header">
                <div>{gettext("Comparing workflows for:")}</div>
                <WorkflowTitle data={data} no_hyperlink={true} class_name="project-title"/>
                {reactDom.createPortal(
                    <a class="hover-shade no-underline" id='project-return' href={update_path["project"].replace(0,data.id)}>
                        <span class="green material-symbols-rounded">arrow_back_ios</span>
                        <div>{gettext("Return to project")}</div>
                    </a>,
                    $(".titlebar .title")[0]
                )}
            </div>
        );
    }

    makeSortable(){
        $(".workflow-array").sortable({
            axis:"x",
            stop:function(evt,ui){

            }
        });
    }

    componentDidMount(){
        this.makeSortable();
        this.updateTabs();
        window.addEventListener("click",(evt)=>{
            if($(evt.target).closest(".other-views").length==0){
                $(".views-dropdown").removeClass("toggled");
            }
        });
    }

    componentDidUpdate(prev_props){
        this.makeSortable();
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

    openEdit(){

    }

    loadWorkflow(){
        let renderer = this.props.renderer;
        renderer.tiny_loader.startLoad();
        getWorkflowSelectMenu(this.props.data.id,"workflow",false,true,(response_data)=>{
            if(response_data.workflowID!=null){
                let workflows = this.state.workflows.slice();
                workflows.push(response_data.workflowID);
                this.setState({workflows:workflows});
            }
        },()=>{renderer.tiny_loader.endLoad()})
    }
    removeWorkflow(workflow_id){
        let workflows = this.state.workflows.slice();
        workflows.splice(workflows.indexOf(workflow_id),1);
        this.setState({workflows:workflows});

    }

    toggleObjectSet(id){
        let object_sets = this.state.object_sets.slice();
        let hidden;
        for(let i=0;i<object_sets.length;i++){
            if(object_sets[i].id==id){
                hidden=!(object_sets[i].hidden);
                object_sets[i].hidden=hidden;
                break;
            }
        }
        this.setState({object_sets:object_sets});
        $(document).triggerHandler("object_set_toggled",{id:id,hidden:hidden});
    }
}

class WorkflowComparisonRendererComponent extends Component{
    constructor(props){
        super(props)
        this.maindiv = React.createRef();
    }


    render(){
        return (
            <div class="workflow-wrapper" id={"workflow-"+this.props.workflowID}>
                <div class="workflow-inner-wrapper" ref={this.maindiv}>
                </div>
                <div class="window-close-button" onClick={this.props.removeFunction}>
                    <img src={config.icon_path+"close.svg"}/>
                </div>
            </div>
        )
    }

    componentDidMount(){
        let loader = new Loader('body');

        let querystring = window.location.search;
        let url_params = new URLSearchParams(querystring);
        let workflows_added = url_params.getAll("workflows").map(workflow_id=>parseInt(workflow_id));
        if(workflows_added.indexOf(this.props.workflowID)<0){
            url_params.append("workflows",this.props.workflowID);
            if (history.pushState) {
                let newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + url_params.toString();
                window.history.pushState({path:newurl},'',newurl);
            }
        }


        getWorkflowContext(
            this.props.workflowID,(context_response_data)=>{
                let context_data = context_response_data.data_package;
                this.renderer = new renderers.WorkflowComparisonRenderer(
                    this.props.workflowID,
                    JSON.parse(context_data.data_package),
                    $(this.maindiv.current),
                    this.props.selection_manager,
                    this.props.tiny_loader,
                    this.props.view_type,
                    this.props.object_sets,
                );
                this.renderer.silent_connect_fail=true;
                this.renderer.connect();
                loader.endLoad();
            }
        );
    }

    componentDidUpdate(prev_props){
        if(prev_props.view_type!=this.props.view_type)this.renderer.render(this.props.view_type);
    }

    componentWillUnmount(){
        let querystring = window.location.search;
        let url_params = new URLSearchParams(querystring);
        let workflows_added = url_params.getAll("workflows").map(workflow_id=>parseInt(workflow_id));
        if(workflows_added.indexOf(this.props.workflowID)>=0){
            workflows_added.splice(workflows_added.indexOf(this.props.workflowID),1);
            url_params.set("workflows",workflows_added);
            if (history.pushState) {
                let newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + url_params.toString();
                window.history.pushState({path:newurl},'',newurl);
            }
        }
    }

}


//Container for common elements for workflows
class WorkflowComparisonBaseViewUnconnected extends EditableComponent{

    constructor(props){
        super(props);
        this.objectType="workflow";
    }

    render(){
        let data = this.props.data;
        let renderer = this.props.renderer;
        let selection_manager = renderer.selection_manager;

        let workflow_content;
        if(renderer.view_type=="outcomeedit"){
            workflow_content=(
                <OutcomeComparisonView renderer={renderer} objectID={data.id}/>
            );
        }else{
            workflow_content = (
                <WorkflowComparisonView renderer={renderer} objectID={data.id}/>
            );
        }


        let style={};
        if(data.lock){
            style.border="2px solid "+data.lock.user_colour;
        }

        let workflow = this;

        return(
            [
                <div class="workflow-header" style={style}>
                    <WorkflowForMenu workflow_data={data} selectAction={this.openEdit.bind(this,null)}/>
                </div>,
                <div class = "workflow-container">
                    {this.addEditable(data,true)}
                    {workflow_content}

                </div>
            ]

        );
    }


    openEdit(evt){
        this.props.renderer.selection_manager.changeSelection(evt,this);
    }

    componentDidMount(){
        this.props.renderer.silent_connect_fail=true;
        this.alignAllHeaders();
        this.addObjectSetTrigger();
    }

    componentDidUpdate(){
        this.alignAllHeaders();
    }

    addObjectSetTrigger(){
        let props=this.props;
        $(document).off("object_set_toggled."+this.props.data.id);
        $(document).on("object_set_toggled."+this.props.data.id,(evt,data)=>{
            props.dispatch(toggleObjectSet(data.id,data.hidden));
        });
    }

    alignAllHeaders(){
        let rank = this.props.rank+1;
        $(".comparison-view .workflow-header").css({"height":""});
        let max_height=0;
        $(".comparison-view .workflow-header").each(function(){
            let this_height = $(this).height();
            if(this_height>max_height)max_height=this_height;
        });
        $(".comparison-view .workflow-header").css({"height":max_height+"px"});
    }


}
const mapWorkflowStateToProps = state=>({
    data:state.workflow,
    object_sets:state.objectset,
})
const mapWorkflowDispatchToProps = {};
export const WorkflowComparisonBaseView = connect(
    mapWorkflowStateToProps,
    null
)(WorkflowComparisonBaseViewUnconnected)


//Basic component representing the workflow
class WorkflowComparisonViewUnconnected extends EditableComponentWithSorting{

    constructor(props){
        super(props);
        this.objectType="workflow";
        this.state={};
    }

    render(){
        let data = this.props.data;
        let renderer = this.props.renderer;
        var weekworkflows = data.weekworkflow_set.map((weekworkflow)=>
            <WeekWorkflowComparisonView condensed={data.condensed} key={weekworkflow} objectID={weekworkflow} parentID={data.id} renderer={renderer}/>
        );

        return(
            <div class="workflow-details">
                <div class="week-block" id={data.id+"-week-block"}>
                    {weekworkflows}
                </div>
            </div>
        );
    }

    componentDidMount(){
        this.makeDragAndDrop();
    }

    componentDidUpdate(){
        this.makeDragAndDrop();
    }

    makeDragAndDrop(){
        this.makeSortableNode(
            $(".week-block").children(".week-workflow").not(".ui-draggable"),
            this.props.objectID,
            "weekworkflow",
            ".week-workflow",
            false,
            false,
            "#workflow-"+this.props.data.id,
            ".week",
            ".week-block"
        );
    }

    stopSortFunction(){
        Constants.triggerHandlerEach($(".week .node"),"component-updated");
    }

    sortableMovedFunction(id,new_position,type,new_parent,child_id){
        if(type=="weekworkflow"){
            this.props.renderer.micro_update(moveWeekWorkflow(id,new_position,new_parent,child_id));
            insertedAt(this.props.renderer,child_id,"week",new_parent,"workflow",new_position,"weekworkflow");
        }
    }



}
export const WorkflowComparisonView =  connect(
    mapWorkflowStateToProps,
    null
)(WorkflowComparisonViewUnconnected)

//Outcome view body for comparison
class OutcomeComparisonViewUnconnected extends OutcomeEditViewUnconnected{
    getParentOutcomeBar(){
        return null;
    }

    makeDragAndDrop(){
        this.makeSortableNode(
            $(this.maindiv.current).find(".outcome-workflow").not("ui-draggable"),
            this.props.objectID,
            "outcomeworkflow",
            ".outcome-workflow",
            false,
            false,
            "#workflow-"+this.props.workflow.id,
        );
        if(this.props.data.depth==0)this.makeDroppable();
    }

    sortableMovedOutFunction(id,new_position,type,new_parent,child_id){
        if(type=="outcomeworkflow" && confirm(gettext("You've moved an outcome to another workflow. Nodes tagged with this outcome will have it removed. Do you want to continue?"))){
            insertedAt(this.props.renderer,null,"outcome",this.props.workflow.id,"workflow",new_position,"outcomeworkflow");
            insertedAtInstant(this.props.renderer,child_id,"outcome",this.props.workflow.id,"workflow",new_position,"outcomeworkflow");
        }
    }

}
const mapOutcomeComparisonStateToProps = state=>({
    data:getSortedOutcomesFromOutcomeWorkflowSet(state,state.workflow.outcomeworkflow_set),
    workflow:state.workflow
})
export const OutcomeComparisonView =  connect(
    mapOutcomeComparisonStateToProps,
    null
)(OutcomeComparisonViewUnconnected)







class ViewBar extends React.Component{

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
                    <div><input type="checkbox" id={"set"+set.id} value={set.id} checked={(!set.hidden)} onChange={this.toggleHidden.bind(this,set.id)}/><label for={"set"+set.id}>{set.title}</label></div>
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

    toggleHidden(id){
        this.props.toggleObjectSet(id);
    }
}
