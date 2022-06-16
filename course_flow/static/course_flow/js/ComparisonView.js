import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {ComponentJSON} from "./ComponentJSON";
import * as Constants from "./Constants";
import {renderMessageBox,closeMessageBox, WorkflowForMenu} from "./MenuComponents";
import {getWorkflowSelectMenu,getWorkflowContext} from "./PostFunctions";
import {WeekWorkflowComparisonView} from "./WeekWorkflowView";



//Container for the workflows to be compared
export class ComparisonView extends React.Component{
    
    constructor(props){
        super(props);
        this.objectType="workflow";
        this.allowed_tabs=[0,1,2,3];
        this.state = {workflows:[]};
    }
    
    render(){
        let data = this.props.data;
        let renderer = this.props.renderer;
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
        if(renderer.view_type=="outcomeedit"){
            if(data.type=="program")this.allowed_tabs=[];
            else this.allowed_tabs=[2,4];
        }else{
            this.allowed_tabs=[1,2,3,4];
        }
        
        
        let view_buttons = [
            {type:"workflowview",name:gettext("Workflow View"),disabled:[]},
            {type:"outcomeedit",name:Constants.capWords(gettext("View")+" "+gettext(data.type+" outcomes")),disabled:[]},
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
            <WorkflowComparisonRendererComponent workflowID={workflowID} key={workflowID} tiny_loader={this.props.tiny_loader} selection_manager={this.props.selection_manager}/>
        );
        workflow_content.push(
            <div>
                <button onClick={this.loadWorkflow.bind(this)}>{gettext("Load new workflow")}</button>
            </div>
        );
        console.log("rendering");
        console.log(workflow_content);
        
        let style={};
        if(data.lock){
            style.border="2px solid "+data.lock.user_colour;
        }    
    
        let project = this;
            
        return(
            <div id="workflow-wrapper" class="workflow-wrapper">
                <div class="workflow-header" style={style}>
                    <WorkflowForMenu workflow_data={data} selectAction={this.openEdit.bind(this)}/>
                </div>
                <div class="workflow-view-select hide-print">
                    {view_buttons_sorted}
                </div>
                <div class = "workflow-container comparison-view">
                    {reactDom.createPortal(
                        <div>{data.title||gettext("Unnamed Project")}</div>,
                        $("#workflowtitle")[0]
                    )}
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
                    
                    {workflow_content}
                    
                    
                    <ViewBar renderer={this.props.renderer}/>
                </div>
            </div>
        
        );
    }
                     
    componentDidMount(){
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
         
    openEdit(){
        
    }

    loadWorkflow(){
        getWorkflowSelectMenu(this.props.data.id,"workflow",false,true,(response_data)=>{
            if(response_data.workflowID!=null){
                console.log("Loaded");
                console.log(response_data);
                let workflows = this.state.workflows.slice();
                workflows.push(response_data.workflowID);
                this.setState({workflows:workflows});
            }
        })
    }
}

class WorkflowComparisonRendererComponent extends React.Component{
    constructor(props){
        super(props)
        this.maindiv = React.createRef();
    }
    
    
    render(){
        console.log("renderer");
        return (
            <div class="workflow-wrapper" id={"workflow-"+this.props.workflowID} ref={this.maindiv}></div>
        )
    }
    
    componentDidMount(){
        console.log("mounted");
        let loader = new Constants.Loader('body');
        getWorkflowContext(
            this.props.workflowID,(context_response_data)=>{
                console.log(context_response_data);
                let context_data = context_response_data.data_package;
                console.log(context_data);
                this.renderer = new renderers.WorkflowComparisonRenderer(
                    this.props.workflowID,
                    JSON.parse(context_data.data_package),
                    $(this.maindiv.current),
                    this.props.selection_manager,
                    this.props.tiny_loader,
                );
                this.renderer.connect();
                loader.endLoad();
            }
        );
    }
}


//Container for common elements for workflows
class WorkflowComparisonBaseViewUnconnected extends ComponentJSON{
    
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
                <OutcomeComparisonView renderer={renderer}/>
            );
        }else{
            workflow_content = (
                <WorkflowComparisonView renderer={renderer}/>
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
                    {this.addEditable(data)}
                    
                    {workflow_content}
                    
                </div>
            ]
        
        );
    }
         
                     
    openEdit(evt){
        this.props.renderer.selection_manager.changeSelection(evt,this);
    }
    
    postMountFunction(){
        this.alignAllHeaders();
    }
    
    componentDidUpdate(){
        this.alignAllHeaders();
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
class WorkflowComparisonViewUnconnected extends ComponentJSON{
    
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
               
    postMountFunction(){
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
            "y",
            false,
            ".week-block",
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




class ViewBar extends ComponentJSON{
     
    render(){
        return ("VIEWBAR TO BE COMPLETED");
        
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
        this.props.dispatch(toggleObjectSet(id));
    }
}



