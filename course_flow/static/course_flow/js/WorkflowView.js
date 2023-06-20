import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {Component, EditableComponent, EditableComponentWithActions, EditableComponentWithSorting, WorkflowTitle, CollapsibleText} from "./ComponentJSON";
import ColumnWorkflowView from "./ColumnWorkflowView";
import WeekWorkflowView from "./WeekWorkflowView";
import {NodeBarColumnWorkflow} from "./ColumnWorkflowView";
import {NodeBarWeekWorkflow} from "./WeekWorkflowView";
import {renderMessageBox,closeMessageBox} from "./MenuComponents";
import * as Constants from "./Constants";
import {changeField, moveColumnWorkflow, moveWeekWorkflow, toggleObjectSet} from "./Reducers";
import {OutcomeBar} from "./OutcomeEditView";
import StrategyView from "./Strategy";
import WorkflowOutcomeView from "./WorkflowOutcomeView";
import WorkflowLegend from "./WorkflowLegend";
import {WorkflowOutcomeLegend} from "./WorkflowLegend";
import {getParentWorkflowInfo,getPublicParentWorkflowInfo,insertedAt,restoreSelf,deleteSelf,getExport, toggleDrop, getUsersForObject, getTargetProjectMenu, duplicateBaseItem} from "./PostFunctions";
import OutcomeEditView from './OutcomeEditView';
import AlignmentView from './AlignmentView';
import CompetencyMatrixView from './CompetencyMatrixView';
import GridView from './GridView';


class WorkflowBaseViewUnconnected extends EditableComponentWithActions{

    constructor(props){
        super(props);
        this.objectType="workflow";
        this.allowed_tabs=[0,1,2,3];
    }

    render(){
        let renderer=this.props.renderer;
        let data=this.props.data;

        return (
            <div id="workflow-wrapper" class="workflow-wrapper">
                {this.getHeader()}
                {reactDom.createPortal(
                    this.getOverflowLinks(),
                    $("#overflow-links")[0]
                )}
                {reactDom.createPortal(
                    this.getEdit(),
                    $("#visible-icons")[0]
                )}
                {reactDom.createPortal(
                    this.getShare(),
                    $("#visible-icons")[0]
                )}
                {this.addEditable(data)}

                <div class = "workflow-container">
                    {this.getWorkflowContent()}
                </div>
                {
                    <NodeBar view_type={renderer.view_type} renderer={this.props.renderer}/>
                }
                {!data.is_strategy &&
                    <OutcomeBar renderer={this.props.renderer}/>
                }
                {!renderer.read_only && 
                    <RestoreBar renderer={this.props.renderer}/>
                }
                {!data.is_strategy &&
                    <ViewBar data={data} renderer={this.props.renderer}/>
                }
                {this.getReturnLinks()}
                {this.getParentWorkflowIndicator()}
            </div>
        )

    }

    componentDidMount(){
        this.getUserData();
        this.updateTabs();
    }

    componentDidUpdate(prev_props){
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
        if(this.props.renderer.read_only)disabled_tabs.push(5);
        $("#sidebar").tabs({disabled:disabled_tabs});
    }
                     
    changeView(type){
        //this.props.renderer.selection_manager.changeSelection(null,null);
        this.props.renderer.render(this.props.renderer.container,type);
    }

    getHeader(){
        let data=this.props.data;
        let style={};
        if(data.lock){
            style.border="2px solid "+data.lock.user_colour;
        }    
        return (
            <div class="project-header" style={style} onClick={(evt)=>this.props.renderer.selection_manager.changeSelection(evt,this)}>
                {this.getProjectLink()}
                <div class="project-header-top-line">
                    <WorkflowTitle data={data} no_hyperlink={true} class_name="project-title"/>
                    {this.getTypeIndicator()}
                </div>
                <div class="project-header-info">
                    <div class="project-info-section project-members">
                        <h4>{gettext("Permissions")}</h4>
                        {this.getUsers()}
                    </div>
                    <div class="project-other">
                        <div class="project-info-section project-description">
                            <h4>{gettext("Description")}</h4>
                            <CollapsibleText text={data.description} defaultText={gettext("No description")}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    getTypeIndicator(){
        let data = this.props.data;
        let type_text=gettext(data.type);
        if(data.is_strategy)type_text+=gettext(" strategy");
        return (
            <div class={"workflow-type-indicator "+data.type}>{type_text}</div>
        );
    }

    getUsers(){
        if(!this.state.users)return null;
        let author = this.state.users.author;
        let editors = this.state.users.editors;
        let commenters = this.state.users.commentors;
        let viewers = this.state.users.viewers;
        let users = []
        if(author)users.push(
            <div class="user-name">
                {Constants.getUserTag("author")}{Constants.getUserDisplay(author)}
            </div>
        )
        users.push([
            editors.filter(user=>user.id!=author.id).map(user=>
                <div class="user-name">
                    {Constants.getUserTag("edit")}{Constants.getUserDisplay(user)}
                </div>
            ),
            commenters.map(user=>
                <div class="user-name">
                    {Constants.getUserTag("comment")}{Constants.getUserDisplay(user)}
                </div>
            ),
            viewers.map(user=>
                <div class="user-name">
                    {Constants.getUserTag("view")}{Constants.getUserDisplay(user)}
                </div>
            ),
        ]);
        if(this.state.users.published){
            users.push(
                <div class="user-name">
                    {Constants.getUserTag("view")}<span class="material-symbols-rounded">public</span> {gettext("All CourseFlow")}
                </div>
            );
        }
        if(!this.props.renderer.read_only)users.push(
            <div class="user-name collapsed-text-show-more" onClick={this.openShareMenu.bind(this)}>
                {gettext("Modify")}
            </div>
        )
        return users;
    }


    getEdit(){
        let edit;
        if(!this.props.renderer.read_only)edit = <div class="hover-shade" id="edit-project-button" title={gettext("Edit Workflow")} onClick={this.openEditMenu.bind(this)}><span class="material-symbols-rounded filled">edit</span></div>
        return edit;
    }

    openEditMenu(evt){
        this.props.renderer.selection_manager.changeSelection(evt,this);
    }

    getShare(){
        let share;
        if(!this.props.renderer.read_only)share = <div class="hover-shade" id="share-button" title={gettext("Sharing")} onClick={this.openShareMenu.bind(this)}><span class="material-symbols-rounded filled">person_add</span></div>
        return share;
    }

    openShareMenu(){
        let component=this;
        let data = this.props.data;
        renderMessageBox(data,"share_menu",()=>{
            closeMessageBox();
            component.getUserData();
        });
    }

    getUserData(){
        if(this.props.renderer.public_view || this.props.renderer.is_student)return null;
        let component = this;
        getUsersForObject(this.props.data.id,this.props.data.type,(data)=>{
            component.setState({users:data});
        });
    }

    getOverflowLinks(){
        let data = this.state.data;
        let liveproject;

        let overflow_links=[];
        overflow_links.push(this.getDeleteWorkflow());
        overflow_links.push(this.getExportButton());
        overflow_links.push(this.getCopyButton());
        overflow_links.push(this.getImportButton());
        return overflow_links;
    }

    getDeleteWorkflow(){
        if(this.props.renderer.read_only)return null;
        if(!this.props.data.deleted)return (
            <div class="hover-shade" onClick={this.deleteWorkflow.bind(this)}>
                <div>{gettext("Delete Workflow")}</div>
            </div>
        )
        else return([
            <div class="hover-shade" onClick={this.restoreWorkflow.bind(this)}>
                <div>{gettext("Restore Workflow")}</div>
            </div>,
            <div class="hover-shade" onClick={this.deleteWorkflowHard.bind(this)}>
                <div>{gettext("Permanently Delete Workflow")}</div>
            </div>
        ])
    }

    deleteWorkflow(){
        if(window.confirm(gettext("Are you sure you want to delete this workflow?"))){
            deleteSelf(this.props.data.id,"workflow",true,()=>{
            });
        }
    }

    deleteWorkflowHard(){
        if(window.confirm(gettext("Are you sure you want to permanently delete this workflow?"))){
            deleteSelf(this.props.data.id,"workflow",false,()=>{
                window.location=update_path["project"].replace(0,renderer.project.id);
            });
        }
    }

    restoreWorkflow(){
        restoreSelf(this.props.data.id,"workflow",()=>{
        });
    }

    getExportButton(){
        if(this.props.renderer.public_view && !user_id)return null;
        if(this.props.renderer.is_student && !this.props.renderer.can_view)return null;
        let export_button = (
            <div id="export-button" class="hover-shade" onClick={()=>renderMessageBox({...this.props.data,object_sets:this.props.object_sets},"export",closeMessageBox)}>
                <div>{gettext("Export")}</div>
            </div>
        );
        return export_button;
    }

    getCopyButton(){
        if(!user_id) return null;
        let export_button = [
            <div id="copy-button" class="hover-shade" onClick={()=>{ 
                let loader = this.props.renderer.tiny_loader;
                if(this.props.data.is_strategy){
                    loader.startLoad();
                    duplicateBaseItem(this.props.data.id,this.props.data.type,null,(response_data)=>{
                        loader.endLoad();
                        window.location = update_path[response_data.new_item.type].replace("0",response_data.new_item.id);
                    })
                }else{
                    getTargetProjectMenu(-1,(response_data)=>{
                        if(response_data.parentID!=null){
                            let loader = new Constants.Loader('body');
                            duplicateBaseItem(this.props.data.id,this.props.data.type,response_data.parentID,(response_data)=>{
                                loader.endLoad();
                                window.location = update_path[response_data.new_item.type].replace("0",response_data.new_item.id);
                            })
                        }
                    });
                }
            }}>
                <div>{gettext("Copy to my library")}</div>
            </div>
        ];
        if(!this.props.data.is_strategy && this.props.renderer.project_permission==Constants.permission_keys.edit)export_button.unshift(
            <div id="copy-to-project-button" class="hover-shade" onClick={()=>{ 
                let loader = this.props.renderer.tiny_loader;
                duplicateBaseItem(this.props.data.id,this.props.data.type,this.props.renderer.project.id,(response_data)=>{
                    loader.endLoad();
                    window.location = update_path[response_data.new_item.type].replace("0",response_data.new_item.id);
                });
            }}>
                <div>{gettext("Copy into current project")}</div>
            </div>
        );
        return export_button;
    }

    getImportButton(){
        if(this.props.renderer.read_only)return null;
        let disabled;
        if(this.props.data.importing)disabled=true;
        let imports=[<hr/>];
        this.pushImport(imports,"outcomes",gettext("Import Outcomes"),disabled);
        this.pushImport(imports,"nodes",gettext("Import Nodes"),disabled);
        
        return imports;
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

    getReturnLinks(){
        let renderer = this.props.renderer;
        let data = this.props.data;
        let return_links = [];
        if(renderer.project && !renderer.is_student && !renderer.public_view){
            return_links.push(
                <a class="hover-shade no-underline" id='project-return' href={update_path["project"].replace(0,renderer.project.id)}>
                    <span class="material-symbols-rounded green">arrow_back_ios</span>
                    <div>{gettext("Return to project")}</div>
                </a>
            );
        }
        if(renderer.public_view && renderer.can_view){
            return_links.push(
                <a class="hover-shade no-underline" id='project-return' href={update_path["project"].replace(0,renderer.project.id)}>
                    <span class="material-symbols-rounded green">arrow_back_ios</span>
                    <div>{gettext("Return to Editable Workflow")}</div>
                </a>
            )
        }
        if(!renderer.public_view && renderer.project && (renderer.is_teacher || renderer.is_student)){
            return_links.push(
                <a class="hover-shade no-underline" id='live-project-return' href={update_path["liveproject"].replace(0,renderer.project.id)}>
                    <span class="material-symbols-rounded green">arrow_back_ios</span>
                    <div>{gettext("Return to classroom (")}<WorkflowTitle class_name={"inline-title"} data={renderer.project} no_hyperlink={true}/>{")"}</div>
                </a>
            );
        }
        return reactDom.createPortal(
            return_links,
            $(".titlebar .title")[0]
        )
    }

    getProjectLink(){
        let renderer=this.props.renderer;
        if(renderer.project && !renderer.is_student && !renderer.public_view)return(
            <WorkflowTitle class_name={"project-title-in-workflow"} data={this.props.renderer.project}/>
        );
        else return null;
    }

    getWorkflowContent(){
        let data = this.props.data;
        let renderer=this.props.renderer;

        let workflow_content;
        if(renderer.view_type=="outcometable"){
            workflow_content=(
                <WorkflowTableView data={data} renderer={renderer} view_type={renderer.view_type}/>
            );
            this.allowed_tabs=[4];
        }
        else if(renderer.view_type=="outcomeedit"){
            workflow_content=(
                <OutcomeEditView renderer={renderer}/>
            );
            if(data.type=="program")this.allowed_tabs=[4];
            else this.allowed_tabs=[2,4];
        }
        else if(renderer.view_type=="alignmentanalysis"){
            workflow_content=(
                <AlignmentView renderer={renderer} view_type={renderer.view_type}/>
            );
            this.allowed_tabs=[4];
        }
        else if(renderer.view_type=="grid"){
            workflow_content=(
                <GridView renderer={renderer} view_type={renderer.view_type}/>
            );
            this.allowed_tabs=[4];
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
            {type:"grid",name:gettext("Grid View"),disabled:["activity", "course"]},
        ].filter(item=>item.disabled.indexOf(data.type)==-1).map(
            (item)=>{
                let view_class = "hover-shade";
                if(item.type==renderer.view_type)view_class += " active";
                //if(item.disabled.indexOf(data.type)>=0)view_class+=" disabled";
                return <a id={"button_"+item.type} class={view_class} onClick = {this.changeView.bind(this,item.type)}>{item.name}</a>;
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

        return [
            <div class="workflow-view-select hide-print">
                {view_buttons_sorted}
            </div>,
            workflow_content
        ];
    }

    getParentWorkflowIndicator(){
        return (
            <ParentWorkflowIndicator renderer={this.props.renderer} workflow_id={this.props.data.id}/>
        )

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



//Container for common elements for workflows
// class WorkflowBaseViewUnconnected extends EditableComponent{
    
//     constructor(props){
//         super(props);
//         this.objectType="workflow";
//         this.allowed_tabs=[0,1,2,3];
//     }
    
//     render(){
//         let data = this.props.data;
//         let renderer = this.props.renderer;
//         let read_only = renderer.read_only;
//         let selection_manager = renderer.selection_manager;
        
//         var selector = this;

//         let workflow_content;
//         if(renderer.view_type=="outcometable"){
//             workflow_content=(
//                 <WorkflowTableView data={data} renderer={renderer} view_type={renderer.view_type}/>
//             );
//             this.allowed_tabs=[4];
//         }
//         // else if(renderer.view_type=="competencymatrix"){
//         //     workflow_content=(
//         //         <CompetencyMatrixView renderer={renderer} view_type={renderer.view_type}/>
//         //     );
//         //     this.allowed_tabs=[];
//         // }
//         else if(renderer.view_type=="outcomeedit"){
//             workflow_content=(
//                 <OutcomeEditView renderer={renderer}/>
//             );
//             if(data.type=="program")this.allowed_tabs=[];
//             else this.allowed_tabs=[2,4];
//         }
//         // else if(renderer.view_type=="horizontaloutcometable"){
//         //     workflow_content=(
//         //         <WorkflowView_Outcome renderer={renderer} view_type={renderer.view_type}/>
//         //     );
//         //     this.allowed_tabs=[1];
//         // }
//         else if(renderer.view_type=="alignmentanalysis"){
//             workflow_content=(
//                 <AlignmentView renderer={renderer} view_type={renderer.view_type}/>
//             );
//             this.allowed_tabs=[4];
//         }
//         else if(renderer.view_type=="grid"){
//             workflow_content=(
//                 <GridView renderer={renderer} view_type={renderer.view_type}/>
//             );
//             this.allowed_tabs=[4];
//         }
//         else{
//             workflow_content = (
//                 <WorkflowView renderer={renderer}/>
//             );
//             this.allowed_tabs=[1,2,3,4];
//         }
        
        
//         let view_buttons = [
//             {type:"workflowview",name:gettext("Workflow View"),disabled:[]},
//             {type:"outcomeedit",name:Constants.capWords(gettext("View")+" "+gettext(data.type+" outcomes")),disabled:[]},
//             {type:"outcometable",name:Constants.capWords(gettext(data.type+" outcome")+" "+ gettext("Table")),disabled:[]},
//             {type:"alignmentanalysis",name:Constants.capWords(gettext(data.type+" outcome")+" "+gettext("Analytics")),disabled:["activity"]},
//             //{type:"competencymatrix",name:Constants.capWords(gettext(data.type+" outcome")+" "+gettext("Evaluation Matrix")),disabled:["activity", "course"]},
//             {type:"grid",name:gettext("Grid View"),disabled:["activity", "course"]},
//             //{type:"horizontaloutcometable",name:gettext("Alignment Table"),disabled:["activity"]}
//         ].filter(item=>item.disabled.indexOf(data.type)==-1).map(
//             (item)=>{
//                 let view_class = "hover-shade";
//                 if(item.type==renderer.view_type)view_class += " active";
//                 //if(item.disabled.indexOf(data.type)>=0)view_class+=" disabled";
//                 return <a id={"button_"+item.type} class={view_class} onClick = {this.changeView.bind(this,item.type)}>{item.name}</a>;
//             }
//         );
        
//         let view_buttons_sorted = view_buttons.slice(0,2);
//         view_buttons_sorted.push(
//             <div class="hover-shade other-views" onClick={()=>$(".views-dropdown")[0].classList.toggle("toggled")}>
//                 {gettext("Other Views")}
//                 <div class="views-dropdown">
//                     {view_buttons.slice(2)}
//                 </div>
//             </div>
//         );

//         let style={};
//         if(data.lock){
//             style.border="2px solid "+data.lock.user_colour;
//         }    
    
//         let workflow = this;

//         let parent_workflow_indicator;
//         parent_workflow_indicator = (
//             <ParentWorkflowIndicator renderer={renderer} workflow_id={data.id}/>
//         )

//         let share;
//         if(!read_only)share = <div class="hover-shade" id="share-button" title={gettext("Sharing")} onClick={renderMessageBox.bind(this,data,"share_menu",closeMessageBox)}><img src={iconpath+"add_person_grey.svg"}/></div>
        
//         let public_view;
//         if(renderer.can_view && data.public_view){
//             if(renderer.public_view){
//                 public_view=[
//                     <hr/>,
//                     <a id="public-view" class="hover-shade" href={update_path.workflow.replace("0",data.id)}>
//                         {gettext("Editable Page")}
//                     </a>
//                 ];
//             }else{
//                 public_view=[
//                     <hr/>,
//                     <a id="public-view" class="hover-shade" href={public_update_path.workflow.replace("0",data.id)}>
//                         {gettext("Public Page")}
//                     </a>
//                 ];
//             }
//         }
//         let return_links = [];
//         if(renderer.project && !renderer.is_student && !renderer.public_view){
//             return_links.push(
//                 <a class="hover-shade no-underline" id='project-return' href={update_path["project"].replace(0,renderer.project.id)}>
//                     <span class="material-symbols-rounded">arrow_back_ios</span>
//                     <div>{gettext("Return to project (")}<WorkflowTitle class_name={"inline-title"} data={renderer.project} no_hyperlink={true}/>{")"}</div>
//                 </a>
//             );
//         }
//         if(renderer.public_view && renderer.can_view){
//             return_links.push(
//                 <a class="hover-shade no-underline" id='project-return' href={update_path["project"].replace(0,renderer.project.id)}>
//                     <span class="material-symbols-rounded">arrow_back_ios</span>
//                     <div>{gettext("Return to Editable Workflow")}</div>
//                 </a>
//             )
//         }
//         if(renderer.project && (renderer.is_teacher || renderer.is_student)){
//             return_links.push(
//                 <a class="hover-shade no-underline" id='live-project-return' href={update_path["liveproject"].replace(0,renderer.project.id)}>
//                     <span class="material-symbols-rounded">arrow_back_ios</span>
//                     <div>{gettext("Return to classroom (")}<WorkflowTitle class_name={"inline-title"} data={renderer.project} no_hyperlink={true}/>{")"}</div>
//                 </a>
//             );
//         }


//         let overflow_links = [];
//         overflow_links.push(this.getExportButton());
//         overflow_links.push(this.getImportButton());
//         overflow_links.push(public_view);
            
//         return(
//             <div id="workflow-wrapper" class="workflow-wrapper">
//                 <div class="workflow-header" style={style}>
//                     <WorkflowForMenu no_hyperlink={true} workflow_data={data} selectAction={this.openEdit.bind(this,null)}/>
//                     {parent_workflow_indicator}
//                 </div>
//                 <div class="workflow-view-select hide-print">
//                     {view_buttons_sorted}
//                 </div>
//                 <div class = "workflow-container">
//                     {this.addEditable(data)}
//                     {!read_only && reactDom.createPortal(
//                         <div class="hover-shade" id="edit-project-button" onClick ={ this.openEdit.bind(this)}>
//                             <img src={iconpath+'edit_pencil.svg'} title={gettext("Edit Workflow")}/>
//                         </div>,
//                         $("#visible-icons")[0]
//                     )}
//                     {reactDom.createPortal(
//                         share,
//                         $("#visible-icons")[0]
//                     )}
//                     {reactDom.createPortal(
//                         return_links,
//                         $(".titlebar .title")[0]
//                     )}
//                     {reactDom.createPortal(
//                         overflow_links,
//                         $("#overflow-links")[0]
//                     )}
                    
//                     {workflow_content}
                    
//                     {!read_only &&
//                         <NodeBar view_type={renderer.view_type} renderer={this.props.renderer}/>
//                     }
//                     {!data.is_strategy &&
//                         <OutcomeBar renderer={this.props.renderer}/>
//                     }
//                     {!read_only && !data.is_strategy && data.type != "program" &&
//                         <StrategyBar/>
//                     }
//                     {!read_only && 
//                         <RestoreBar renderer={this.props.renderer}/>
//                     }
//                     {!data.is_strategy &&
//                         <ViewBar data={this.props.data} renderer={this.props.renderer}/>
//                     }
//                 </div>
//             </div>
        
//         );
//     }
                     
//     componentDidMount(){
//         this.updateTabs();    
//         window.addEventListener("click",(evt)=>{
//             if($(evt.target).closest(".other-views").length==0){
//                 $(".views-dropdown").removeClass("toggled");
//             }
//         });
//     }
                     
//     componentDidUpdate(prev_props){
//         if(prev_props.view_type!=this.props.view_type)this.updateTabs();
//     }
                    
//     updateTabs(){
//         //If the view type has changed, enable only appropriate tabs, and change the selection to none
//         this.props.renderer.selection_manager.changeSelection(null,null);
//         let disabled_tabs=[];
//         for(let i=0;i<4;i++)if(this.allowed_tabs.indexOf(i)<0)disabled_tabs.push(i);
//         $("#sidebar").tabs({disabled:false});
//         let current_tab = $("#sidebar").tabs("option","active");
//         if(this.allowed_tabs.indexOf(current_tab)<0){
//             if(this.allowed_tabs.length==0)$("#sidebar").tabs({active:false});
//             else $("#sidebar").tabs({active:this.allowed_tabs[0]});
//         }
//         $("#sidebar").tabs({disabled:disabled_tabs});
//     }
                     
//     changeView(type){
//         this.props.renderer.selection_manager.changeSelection(null,null);
//         this.props.renderer.render(this.props.renderer.container,type);
//     }
    
//     openEdit(evt){
//         this.props.renderer.selection_manager.changeSelection(evt,this);
//     }
       
//     getExportButton(){
//         if(this.props.renderer.public_view)return null;
//         if(this.props.renderer.is_student && !this.props.renderer.can_view)return null;
//         let export_button = (
//             <a id="export-button" class="hover-shade" onClick={()=>renderMessageBox({...this.props.data,object_sets:this.props.object_sets},"export",closeMessageBox)}>
//                 {gettext("Export")}
//             </a>
//         );
//         return export_button;
//     }

//     getImportButton(){
//         if(this.props.renderer.read_only)return null;
//         let disabled;
//         if(this.props.data.importing)disabled=true;
//         let imports=[];
//         this.pushImport(imports,"outcomes",gettext("Import Outcomes"),disabled);
//         this.pushImport(imports,"nodes",gettext("Import Nodes"),disabled);
        
//         return imports;
//     }
                     
//     pushImport(imports,import_type,text,disabled){
//         let a_class = "hover-shade";
//         if(disabled)a_class=" disabled";
//         imports.push(
//             <a class={a_class} onClick={this.clickImport.bind(this,import_type)}>
//                 {text}
//             </a>
//         )
//     }
                     
//     clickImport(import_type,evt){
//         evt.preventDefault();
//         renderMessageBox({"object_id":this.props.data.id,"object_type":this.objectType,import_type:import_type},"import",()=>{closeMessageBox()});
//     }
    
// }
// const mapWorkflowStateToProps = state=>({
//     data:state.workflow,
//     object_sets:state.objectset,
// })
// const mapWorkflowDispatchToProps = {};
// export const WorkflowBaseView = connect(
//     mapWorkflowStateToProps,
//     null
// )(WorkflowBaseViewUnconnected)


//Basic component representing the workflow
class WorkflowViewUnconnected extends EditableComponentWithSorting{
    
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
                <WorkflowLegend renderer={renderer}/>
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
                     
    
                     
    componentDidMount(){
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
}
export const WorkflowView =  connect(
    mapWorkflowStateToProps,
    null
)(WorkflowViewUnconnected)

class WorkflowTableView extends React.Component{
    render(){
        let data=this.props.data;
        if(data.table_type==1)return <CompetencyMatrixView view_type={this.props.view_type} renderer={this.props.renderer}/>
        else return <WorkflowView_Outcome view_type={this.props.view_type} renderer={this.props.renderer}/>
    }
}

class ViewBarUnconnected extends React.Component{
     
    render(){
        let data=this.props.data;
        let sort_block;
        if(this.props.renderer.view_type=="outcometable"||this.props.renderer.view_type=="horizontaloutcometable"){        
            let table_type_value=data.table_type || 0;
            let sort_type=(
                <div class="node-bar-sort-block">
                    {this.props.renderer.outcome_sort_choices.map((choice)=>
                        <div>
                            <input disabled={(table_type_value==1 || (data.type=="program" && choice.type>1))} type="radio" id={"sort_type_choice"+choice.type} name={"sort_type_choice"+choice.type} value={choice.type} checked={(data.outcomes_sort==choice.type)} onChange={this.changeSort.bind(this)}/>
                            <label for={"sort_type_choice"+choice.type}>{choice.name}</label>
                        </div>

                    )}
                </div>
            );
            let table_type=(
                <div class="node-bar-sort-block">
                    <div><input type="radio" id={"table_type_table"} name="table_type_table" value={0} checked={(table_type_value==0)} onChange={this.changeTableType.bind(this)}/><label for="table_type_table">{gettext("Table Style")}</label></div>
                    <div><input type="radio" id={"table_type_matrix"} name="table_type_matrix" value={1} checked={(table_type_value==1)} onChange={this.changeTableType.bind(this)}/><label for="table_type_matrix">{gettext("Competency Matrix Style")}</label></div>
                </div>
            );
            sort_block = (
                <div>
                    <h4>{gettext("Sort Nodes")}:</h4>
                    {sort_type}
                    <h4>{gettext("Table Type")}:</h4>
                    {table_type}
                </div>
            );
        }


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

        var nodebarweekworkflows;
        if(this.props.renderer.view_type=="workflowview")nodebarweekworkflows= [
            <h4>{gettext("Jump To")}</h4>,
            <div class="node-bar-week-block">
                {data.weekworkflow_set.map((weekworkflow)=>
                    <NodeBarWeekWorkflow key={weekworkflow} order={data.weekworkflow_set} renderer={this.props.renderer} objectID={weekworkflow}/>
                )}
            </div>,
            <hr/>
        ];
        return reactDom.createPortal(
            <div id="node-bar-workflow" class="right-panel-inner">
                {nodebarweekworkflows}
                <div id="expand-collapse-all">
                    <div>{gettext("Expand/Collapse All")}</div>
                    <div>
                        <img class="hover-shade" src={iconpath+"plus.svg"} onClick={this.expandAll.bind(this)}/><img class="hover-shade" src={iconpath+"minus.svg"} onClick={this.collapseAll.bind(this)}/>
                    </div>
                </div>
                {sort_block}
                <h4>{gettext("Object Sets")}</h4>
                {sets}
            </div>
        ,$("#view-bar")[0]);
    }
    
    toggleHidden(id,hidden){
        this.props.dispatch(toggleObjectSet(id,hidden));
    }

    expandAll(){
        this.props.weeks.forEach(week=>toggleDrop(week.id,"week",true,this.props.dispatch));
    }

    collapseAll(){
        this.props.weeks.forEach(week=>toggleDrop(week.id,"week",false,this.props.dispatch));
    }

    changeSort(evt){
        this.props.dispatch(changeField(this.props.data.id,"workflow",{"outcomes_sort":evt.target.value}));
    }
    changeTableType(evt){
        this.props.dispatch(changeField(this.props.data.id,"workflow",{"table_type":evt.target.value}));
    }
}
export const ViewBar =  connect(
    (state)=>({
        object_sets:state.objectset,
        weeks:state.week,
    }),
    null
)(ViewBarUnconnected)


class NodeBarUnconnected extends React.Component{
    
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
        
        
        
        let nodebar_nodes;
        if(!this.props.renderer.read_only)nodebar_nodes= [
            <h4 class="drag-and-drop">{gettext("Nodes")}</h4>,
            <div class="node-bar-column-block">
                {nodebarcolumnworkflows}
            </div>,
        ];
        
        var strategies = this.props.available_strategies.map((strategy)=>
            <StrategyView key={strategy.id} objectID={strategy.id} data={strategy}/>
        );
        var saltise_strategies = this.props.saltise_strategies.map((strategy)=>
            <StrategyView key={strategy.id} objectID={strategy.id} data={strategy}/>
        );
        
        
        return reactDom.createPortal(
            <div id="node-bar-workflow" class="right-panel-inner">
                {nodebar_nodes}
                <hr/>
                <h4 class="drag-and-drop">{gettext("My Strategies")}</h4>
                <div class="strategy-bar-strategy-block">
                    {strategies}
                </div>
                {(saltise_strategies.length>0) &&
                    [<h4 class="drag-and-drop">{gettext("SALTISE Strategies")}</h4>,
                    <div class="strategy-bar-strategy-block">
                        {saltise_strategies}
                    </div>
                     ]
                }
            </div>
        ,$("#node-bar")[0]);
    }


    
}
const mapNodeBarStateToProps = state=>({
    data:state.workflow,
    columns:state.column,
    available_strategies:state.strategy,
    saltise_strategies:state.saltise_strategy,
})
export const NodeBar = connect(
    mapNodeBarStateToProps,
    null
)(NodeBarUnconnected)

class RestoreBarUnconnected extends React.Component{
    
    constructor(props){
        super(props);
        this.objectType="workflow";
    }
    
    
    render(){

        let columns = this.props.columns.map((column)=>
            <RestoreBarItem key={column.id} objectType="column" data={column} renderer={this.props.renderer}/>
        )
        let weeks = this.props.weeks.map((week)=>
            <RestoreBarItem key={week.id} objectType="week" data={week} renderer={this.props.renderer}/>
        )
        let nodes = this.props.nodes.map((node)=>
            <RestoreBarItem key={node.id} objectType="node" data={node} renderer={this.props.renderer}/>
        )
        let outcomes = this.props.outcomes.map((outcome)=>
            <RestoreBarItem key={outcome.id} objectType="outcome" data={outcome} renderer={this.props.renderer}/>
        )
        let nodelinks = this.props.nodelinks.map((nodelink)=>
            <RestoreBarItem key={nodelink.id} objectType="nodelink" data={nodelink} renderer={this.props.renderer}/>
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

class RestoreBarItem extends Component{
    
    render(){
        return (
            <div ref={this.maindiv} class="restore-bar-item">
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
        if(window.confirm(gettext("Are you sure you want to permanently delete this object?"))){
            $(this.maindiv.current).children("button").attr("disabled",true);
            this.props.renderer.tiny_loader.startLoad();
            deleteSelf(this.props.data.id,this.props.objectType,false,()=>{
                this.props.renderer.tiny_loader.endLoad();
            });
        }
    }
}

// class StrategyBarUnconnected extends React.Component{
    
//     constructor(props){
//         super(props);
//         this.objectType="workflow";
//     }
    
    
//     render(){
        
//         var strategies = this.props.available_strategies.map((strategy)=>
//             <StrategyView key={strategy.id} objectID={strategy.id} data={strategy}/>
//         );
//         console.log("saltise strats")
//         console.log(this.props.saltise_strategies)
//         var saltise_strategies = this.props.saltise_strategies.map((strategy)=>
//             <StrategyView key={strategy.id} objectID={strategy.id} data={strategy}/>
//         );
        
        
        
//         return reactDom.createPortal(
//             <div id="strategy-bar-workflow" class="right-panel-inner">
//                 <h4 class="drag-and-drop">{gettext("My Strategies")}:</h4>
//                 <div class="strategy-bar-strategy-block">
//                     {strategies}
//                 </div>
//                 {(saltise_strategies.length>0) &&
//                     [<h4 class="drag-and-drop">{gettext("SALTISE Strategies")}:</h4>,
//                     <div class="strategy-bar-strategy-block">
//                         {saltise_strategies}
//                     </div>
//                      ]
//                 }
//             </div>
//         ,$("#strategy-bar")[0]);
//     }
    
// }
// const mapStrategyBarStateToProps = state=>({
//     data:state.workflow,
//     available_strategies:state.strategy,
//     saltise_strategies:state.saltise_strategy,
// })
// export const StrategyBar = connect(
//     mapStrategyBarStateToProps,
//     null
// )(StrategyBarUnconnected)


//Basic component representing the workflow
class WorkflowView_Outcome_Unconnected extends React.Component{
    
    constructor(props){
        super(props);
        this.objectType="workflow";
        this.state={};
    }
    
    render(){
        let data = this.props.data;
        
        var selector = this;
        let renderer = this.props.renderer;
        
        
        return(
            <div class="workflow-details">
                <WorkflowOutcomeLegend renderer={renderer} outcomes_type={data.outcomes_type}/>
                <WorkflowOutcomeView renderer={renderer} outcomes_type={data.outcomes_type}/>
            </div>
        );
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
            if(this.state.parent_workflows.length==0 && this.props.child_workflows.length==0)return null;
            let parent_workflows = this.state.parent_workflows.map(parent_workflow=>
                <WorkflowTitle data={parent_workflow} class_name={"panel-favourite"}/>
            );
            let child_workflows = this.props.child_workflows.map(child_workflow=>
                <WorkflowTitle data={child_workflow} class_name={"panel-favourite"}/>
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
        if(this.props.renderer.public_view){
            getPublicParentWorkflowInfo(this.props.workflow_id,response_data=>
                this.setState({parent_workflows:response_data.parent_workflows,has_loaded:true})
            );
        }else{
            getParentWorkflowInfo(this.props.workflow_id,response_data=>
                this.setState({parent_workflows:response_data.parent_workflows,has_loaded:true})
            );
        }
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
        description:node.linked_workflow_data.description,
        url:node.linked_workflow_data.url,
        deleted:node.linked_workflow_data.deleted,
    }))
});
export const ParentWorkflowIndicator = connect(
    mapParentWorkflowIndicatorStateToProps,
    null
)(ParentWorkflowIndicatorUnconnected)




