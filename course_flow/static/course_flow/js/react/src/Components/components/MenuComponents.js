import * as React from 'react';
import * as reactDom from 'react-dom';
import { connect } from 'react-redux';
import {
  updateValueInstant,
  deleteSelf,
  setLinkedWorkflow,
  duplicateBaseItem,
  getAddedWorkflowMenu,
  addTerminology
} from '../../PostFunctions.js';
import * as Constants from '../../Constants.js';
import * as Utility from '../../UtilityFunctions.js';
import { ShareMenu } from './ShareMenu.js';
import { ImportMenu } from './ImportMenu.js';
import { ExportMenu } from './ExportMenu.js';
import { WorkflowForMenu } from '../../Library.js';
import { LiveProjectSettings } from '../Views/LiveProjectView.js';


/*
Creates a message box with a screen barrier for popups.
The choice of which menu is displayed is determined by props.message_type.
*/
export class MessageBox extends React.Component{
    render(){
        var menu;
        if(this.props.message_type === "linked_workflow_menu"||this.props.message_type==="target_project_menu" || this.props.message_type==="added_workflow_menu" || this.props.message_type==="workflow_select_menu")menu=(
            <WorkflowsMenu type={this.props.message_type} data={this.props.message_data} actionFunction={this.props.actionFunction}/>
        );
        if(this.props.message_type==="project_edit_menu")menu=(
            <ProjectEditMenu type={this.props.message_type} data={this.props.message_data} actionFunction={this.props.actionFunction}/>
        );
        if(this.props.message_type==="share_menu")menu=(
            <ShareMenu data={this.props.message_data} actionFunction={this.props.actionFunction}/>
        );
        if(this.props.message_type==="import")menu=(
            <ImportMenu data={this.props.message_data} actionFunction={this.props.actionFunction}/>
        );
        if(this.props.message_type==="export")menu=(
            <ExportMenu data={this.props.message_data} actionFunction={this.props.actionFunction}/>
        );
        return(
            <div class="screen-barrier" onClick={(evt)=>evt.stopPropagation()}>
                <div class={"message-box "+this.props.message_type}>
                    {menu}
                </div>
            </div>
        );
    }
}

/*
Creates a set of sections (tabs) of workflow/project card grids.
Currently this is shaped in the back-end, this is definitely something
that could (should?) be changed. This was part of my earliest work,
when I was still trying to put a lot of what should have been front-end logic
into the back-end.

Used for selecting a workflow in a menu when linking a workflow, choosing a target project
for duplication, etc.
*/
export class WorkflowsMenu extends React.Component{
    constructor(props){
        super(props);
        this.state={};
        if(this.props.type=="target_project_menu"){
            try{this.current_project = project_data}catch(err){}
            try{this.current_project = workflow_data_package.project}catch(err){}
            if(this.current_project)this.state.selected=this.current_project.id;
        }
        if(this.props.type=="linked_workflow_menu"||this.props.type=="added_workflow_menu")this.project_workflows = props.data.data_package.current_project.sections.map(section=>section.objects.map((object)=>object.id)).flat();
    }

    render(){
        var data_package = this.props.data.data_package;
        let no_hyperlink = false;
        if(this.props.type=="linked_workflow_menu" || this.props.type=="added_workflow_menu" || this.props.type=="target_project_menu" || this.props.type=="workflow_select_menu")no_hyperlink=true;
        var tabs = [];
        var tab_li = [];
        var i = 0;
        for(var prop in data_package){
            tab_li.push(
                <li class="tab-header"><a class="hover-shade" href={"#tabs-"+i}>{data_package[prop].title}</a></li>
            )
            tabs.push(
                <MenuTab no_hyperlink={no_hyperlink} data={data_package[prop]} type={this.props.type} identifier={i} selected_id={this.state.selected} selectAction={this.workflowSelected.bind(this)}/>
            )
            i++;
        }
        let current_project;
        if(this.current_project){
            current_project = [
                <h4 class={"big-space"}>{gettext("Current project")}</h4>,
                <div class="menu-grid">
                    <WorkflowForMenu workflow_data={this.current_project} selected={(this.state.selected==this.current_project.id)} no_hyperlink={no_hyperlink} type={this.props.type} dispatch={this.props.dispatch} selectAction={this.workflowSelected.bind(this)}/>
                </div>,
                <hr class={"big-space"}/>,
                <h4 class={"big-space"}>{gettext("Or select from your projects")}</h4>,
            ]
        }
        return(
            <div class="message-wrap">
                {this.getTitle()}
                {current_project}
                <div class="home-tabs" id="workflow-tabs">
                    <ul>
                        {tab_li}
                    </ul>
                    {tabs}
                </div>
                <div class="action-bar">
                    {this.getActions()}
                </div>
            </div>
        );

    }

    getTitle(){
        switch(this.props.type){
            case "linked_workflow_menu":
            case "added_workflow_menu":
            case "workflow_select_menu":
                return(
                    <h2>{gettext("Select a workflow")}</h2>
                );
            case "target_project_menu":
                return(
                    <h2>{gettext("Select a project")}</h2>
                );
        }
        return null;


    }


    workflowSelected(selected_id,selected_type){
        this.setState({selected:selected_id,selected_type:selected_type});
    }

    getActions(){
        var actions = [];
        if(this.props.type=="linked_workflow_menu"){
            var text=gettext("link to node");
            if(this.state.selected && this.project_workflows.indexOf(this.state.selected)<0)text=gettext("Copy to Current Project and ")+text;
            actions.push(
                <button id="set-linked-workflow-cancel" class="secondary-button" onClick={closeMessageBox}>
                    {gettext("Cancel")}
                </button>
            );
            actions.push(
                <button id="set-linked-workflow-none" class="secondary-button" onClick={()=>{
                    setLinkedWorkflow(this.props.data.node_id,-1,this.props.actionFunction)
                    closeMessageBox();
                }}>
                    {gettext("Set to None")}
                </button>
            );
            actions.push(
                <button id="set-linked-workflow" disabled={!this.state.selected} class="primary-button" onClick={()=>{
                    setLinkedWorkflow(this.props.data.node_id,this.state.selected,this.props.actionFunction)
                    closeMessageBox();
                }}>
                    {text}
                </button>
            );
        }else if(this.props.type=="added_workflow_menu" || this.props.type=="workflow_select_menu"){
            var text;
            if(this.props.type=="added_workflow_menu"){
                text=gettext("Select");
                if(this.state.selected && this.project_workflows.indexOf(this.state.selected)<0)text=gettext("Copy to Current Project");
            }else{
                text=gettext("Select");
            }
            actions.push(
                <button id="set-linked-workflow-cancel" class="secondary-button" onClick={closeMessageBox}>
                    {gettext("Cancel")}
                </button>
            );
            actions.push(
                <button id="set-linked-workflow" class="primary-button" disabled={!this.state.selected} onClick={()=>{

                    this.props.actionFunction({workflowID:this.state.selected});
                    closeMessageBox();
                }}>
                    {text}
                </button>
            );
        }else if(this.props.type=="target_project_menu"){
            actions.push(
                <button id="set-linked-workflow-cancel" class="secondary-button" onClick={closeMessageBox}>
                    {gettext("Cancel")}
                </button>
            );
            actions.push(
                <button id="set-linked-workflow" class="primary-button" disabled={!this.state.selected} onClick={()=>{
                    this.props.actionFunction({parentID:this.state.selected});
                    closeMessageBox();
                }}>
                    {gettext("Select project")}
                </button>
            );
        }
        return actions;
    }

    componentDidMount(){
        $("#workflow-tabs").tabs({active:0});
        $("#workflow-tabs .tab-header").on("click",()=>{this.setState({selected:null})})
    }
}

/*
Creates a single section of the tabbed workflow grids
*/
export class MenuSection extends React.Component{

    constructor(props){
        super(props);
        this.dropdownDiv=React.createRef();
    }

    render(){
        let section_type = this.props.section_data.object_type;
        let is_strategy = this.props.section_data.is_strategy;
        let parentID = this.props.parentID;
        var objects = this.props.section_data.objects.map((object)=>
            <WorkflowForMenu no_hyperlink={this.props.no_hyperlink} key={object.id} type={this.props.type} workflow_data={object} objectType={section_type} selected={(this.props.selected_id==object.id)}  dispatch={this.props.dispatch} selectAction={this.props.selectAction} parentID={this.props.parentID} duplicate={this.props.duplicate}/>
        );
        if(this.props.replacement_text)objects=this.props.replacement_text;


        let add_button;
        if(config.create_path && this.props.add){
            let types;
            if(section_type==="workflow")types=["program","course","activity"];
            else types=[section_type];
            let adds;
            {
                adds=types.map((this_type)=>
                    <a class="hover-shade" href={config.create_path[this_type]}>
                        {gettext("Create new ")+gettext(this_type)}
                    </a>
                );
                let import_text = gettext("Import ")+gettext(section_type);
                if(is_strategy)import_text+=gettext(" strategy")
                adds.push(
                    <a class="hover-shade" onClick={()=>{
                        getAddedWorkflowMenu(parentID,section_type,is_strategy,false,(response_data)=>{
                            if(response_data.workflowID!=null){
                                let loader = new Utility.Loader('body');
                                duplicateBaseItem(
                                    response_data.workflowID,section_type,
                                    parentID,(duplication_response_data)=>{
                                        loader.endLoad();
                                        location.reload();
                                    }
                                );
                            }
                        });
                    }}>{import_text}</a>
                );
            }
            add_button=(
                <div class="menu-create hover-shade" ref={this.dropdownDiv}>
                    <img
                      class={"create-button create-button-"+this.props.section_data.object_type+" link-image"} title={gettext("Add New")}
                      src={config.icon_path+"add_new_white.svg"}
                    /><div>{this.props.section_data.title}</div>
                    <div class="create-dropdown">
                        {adds}
                    </div>
                </div>
            )

        }

        return (
            <div class={"section-"+this.props.section_data.object_type}>
                {add_button}
                <div class="menu-grid">
                    {objects}
                </div>
            </div>
        );

    }

    componentDidMount(){
        makeDropdown(this.dropdownDiv.current);
    }


}

/*
A tab for the menu of workflows.
*/
export class MenuTab extends React.Component{
    render(){
        let is_empty=true;
        for(let i=0;i<this.props.data.sections.length;i++){
            if(this.props.data.sections[i].objects.length>0){is_empty=false;break;}
        }
        let replacement_text;
        if(is_empty)replacement_text=this.props.data.emptytext;
        var sections = this.props.data.sections.map((section,i)=>
            <MenuSection no_hyperlink={this.props.no_hyperlink} type={this.props.type} replacement_text={i==0?replacement_text:null} section_data={section} add={this.props.data.add} selected_id={this.props.selected_id} dispatch={this.props.dispatch} selectAction={this.props.selectAction} parentID={this.props.parentID} duplicate={this.props.data.duplicate}/>
        );
        return (
            <div id={"tabs-"+this.props.identifier}>
                {sections}
            </div>
        );
    }
}

/*
Mostly no longer used, only currently used by the "My Classrooms" view which is not a priority to revamp.
*/
class WorkflowGridMenuUnconnected extends React.Component{
    render(){
        var tabs = [];
        var tab_li = [];
        var i = 0;
        for(var prop in this.props.data_package){
            tab_li.push(
                <li><a class="hover-shade" href={"#tabs-"+i}>{this.props.data_package[prop].title}</a></li>
            )
            tabs.push(
                <MenuTab data={this.props.data_package[prop]} dispatch={this.props.dispatch} type="gridmenu" identifier={i}/>
            )
            i++;
        }
        return(
            <div class="project-menu">
                <div class="home-tabs" id="home-tabs">
                    <ul>
                        {tab_li}
                    </ul>
                    {tabs}
                </div>
            </div>
        );

    }

    componentDidMount(){
        $("#home-tabs").tabs({
            activate:(evt,ui)=>{
                //window.location.hash=ui.newPanel[0].id;
            }
        });
    }
}
export const WorkflowGridMenu = connect(
    state=>({data_package:state}),
    null
)(WorkflowGridMenuUnconnected)


/*
The menu for editing a project.
*/
export class ProjectEditMenu extends React.Component{
    constructor(props){
        super(props);
        this.state={...props.data,selected_set:"none"};
        this.object_set_updates={};
    }

    render(){
        var data = this.state;

        let all_disciplines;
        let disciplines;
        if(data.all_disciplines){
            disciplines = data.all_disciplines.filter(discipline=>data.disciplines.indexOf(discipline.id)>=0).map((discipline)=>
                <div class="flex-middle discipline-tag">
                    {discipline.title}
                    <span class="material-symbols-rounded green" onClick={this.removeDiscipline.bind(this,discipline.id)}>
                        close
                    </span>
                </div>
            );
        }
        let title=Utility.unescapeCharacters(data.title || "");
        let description=Utility.unescapeCharacters(data.description || "");

        let object_sets=Constants.object_sets_types();
        let set_options = Object.keys(object_sets).map(key=>
            <option value={key}>{object_sets[key]}</option>
        );

        let selected_set;
        if(this.state.selected_set)selected_set=object_sets[this.state.selected_set];
        let sets_added = data.object_sets.map(item=>
            <div class="nomenclature-row">
                <div>{object_sets[item.term]}</div>
                <input value={item.title} onChange={this.termChanged.bind(this,item.id)}/>
                <div class="nomenclature-delete-button" onClick={this.deleteTerm.bind(this,item.id)}>
                    <span class="material-symbols-rounded filled green hover-shade">delete</span>
                </div>
            </div>
        );

        let published_enabled = (data.title && data.disciplines.length>0);
        if(data.published && !published_enabled)this.setState({published:false})
        let disabled_publish_text;
        if(!published_enabled)disabled_publish_text = gettext("A title and at least one discipline is required for publishing.");
        let add_term_css="material-symbols-rounded filled";
        let clickEvt;
        if(this.addTermDisabled(selected_set)){
            clickEvt=()=>console.log("Disabled");
            add_term_css += " grey";
        }else{
            clickEvt=this.addTerm.bind(this);
            add_term_css +=" green hover-shade"
        }
        return(
            <div class="message-wrap">
                <h2>{gettext("Edit project")}</h2>
                <div>
                    <h4>{gettext("Title")}</h4>
                    <textarea autocomplete="off" id="project-title-input" value={title} onChange={this.inputChanged.bind(this,"title")}/>
                </div>
                <div>
                    <h4>{gettext("Description")}</h4>
                    <textarea autocomplete="off" id="project-description-input" value={description} onChange={this.inputChanged.bind(this,"description")}/>
                </div>
                <div>
                    <h4>{gettext("Disciplines")}</h4>
                    <div class="flex-middle disciplines-div">
                        {disciplines}
                    </div>
                    <input autocomplete="off" id="project-discipline-input" placeholder="Search"/>
                </div>
                <div>
                    <h4>{gettext("Object sets")}</h4>
                    <div class="workflow-created">{"Define categories for outcomes or nodes"}</div>
                    {sets_added}
                    <div class="nomenclature-row">
                        <select id="nomenclature-select" value={this.state.selected_set} onChange={this.inputChanged.bind(this,"selected_set")}>
                            <option value="none">{gettext("Select a type")}</option>
                            {set_options}
                        </select>
                        <input placeholder={gettext("Set name")} type="text" id="term-singular" maxlength="50" value={this.state.termsingular} onChange={this.inputChanged.bind(this,"termsingular")} disabled={(selected_set==null)}/>
                        <div class="nomenclature-add-button" onClick={clickEvt}>
                            <span class={add_term_css}>add_circle</span>
                        </div>
                    </div>
                </div>
                {this.getLiveProjectSettings()}
                <div class="action-bar">
                    {this.getActions()}
                </div>
                <div class="window-close-button" onClick={closeMessageBox}>
                    <span class="material-symbols-rounded green">close</span>
                </div>
            </div>
        );
    }

    deleteTerm(id){
        if(window.confirm(gettext("Are you sure you want to delete this ")+gettext("set")+"?")){
            let new_state_dict=this.state.object_sets.slice()
            for(let i=0;i<new_state_dict.length;i++){
                if(new_state_dict[i].id==id){
                    deleteSelf(id,"objectset");
                    new_state_dict.splice(i,1);
                    this.setState({object_sets:new_state_dict});
                    break;
                }
            }
        }
    }

    addTerm(){
        let term = $("#nomenclature-select")[0].value;
        let title = $("#term-singular")[0].value;
        addTerminology(this.state.id,term,title,"",response_data=>{
            this.setState({object_sets:response_data.new_dict,selected_set:"none",termsingular:""})
        });
    }

    termChanged(id,evt){
        let new_sets = this.state.object_sets.slice()
        for(var i=0;i<new_sets.length;i++){
            if(new_sets[i].id==id){
                new_sets[i]={...new_sets[i],title:evt.target.value};
                this.object_set_updates[id]={title:evt.target.value};
            }
        }
        this.setState({object_sets:new_sets,changed:true});
    }

    updateTerms(){
        for(var object_set_id in this.object_set_updates){
            updateValueInstant(object_set_id,"objectset",this.object_set_updates[object_set_id]);
        }
    }

    addTermDisabled(selected_set){
        if(!selected_set)return true;
        if(!this.state.termsingular)return true;
        return false;
    }


    addDiscipline(id){
        this.setState(
            (state,props)=>{
                return {disciplines:[...state.disciplines,id],changed:true};
            }
        );
    }

    removeDiscipline(id){
        this.setState(
            (state,props)=>{
                return {disciplines:state.disciplines.filter(value=>value!=id),changed:true};
            }
        );
    }


    inputChanged(field,evt){
        var new_state={changed:true}
        new_state[field]=evt.target.value;
        if(field=="selected_set")new_state["termsingular"]="";
        this.setState(new_state);
    }


    checkboxChanged(field,evt){
        if(field=="published"){
            if(!this.state.published && !window.confirm(gettext("Are you sure you want to publish this project, making it fully visible to anyone with an account?"))){
                return;
            }else if(this.state.published && !window.confirm(gettext("Are you sure you want to unpublish this project, rendering it hidden to all other users?"))){
                return;
            }
        }
        var new_state={changed:true}
        new_state[field]=evt.target.checked;
        this.setState(new_state);
    }

    getActions(){
        var actions = [];
        actions.push(
            <button class="secondary-button" onClick={closeMessageBox}>
                {gettext("Cancel")}
            </button>
        );
        actions.push(
            <button id="save-changes" class="primary-button" disabled={!this.state.changed} onClick={()=>{
                updateValueInstant(this.state.id,"project",{title:this.state.title,description:this.state.description,published:this.state.published,disciplines:this.state.disciplines});
                this.updateTerms();
                this.props.actionFunction({...this.state,changed:false});
                closeMessageBox();
            }}>
                {gettext("Save Changes")}
            </button>
        );
        return actions;
    }

    getLiveProjectSettings(){
        if(this.props.data.renderer.user_role==Constants.role_keys.teacher){
            return (
                <div>
                    <LiveProjectSettings renderer={this.props.renderer} role={"teacher"} objectID={this.state.id} view_type={"settings"} updateLiveProject={this.props.actionFunction}/>
                </div>
            );
        }
        return null;
    }

    componentDidMount(){
        if(this.state.all_disciplines)this.autocompleteDiscipline();
    }

    componentDidUpdate(){
        if(this.state.all_disciplines)this.autocompleteDiscipline();
    }

    autocompleteDiscipline(){
        let choices = this.state.all_disciplines.filter(discipline=>this.state.disciplines.indexOf(discipline.id)<0).map(discipline=>({
            value:discipline.title,
            label:discipline.title,
            id:discipline.id,
        }));
        $("#project-discipline-input").autocomplete({
            source:choices,
            minLength:0,
            focus:null,
            select:(evt,ui)=>{
                this.addDiscipline(ui.item.id);
                $("#project-discipline-input").val("");
                return false;
            },
        }).focus(function() {
            $("#project-discipline-input").autocomplete("search", $("#project-discipline-input").val());
        });
    }
}


/*
Function calls to create or unmount the popup box.
*/
export function renderMessageBox(data,type,updateFunction){
    reactDom.render(
        <MessageBox message_data={data} message_type={type} actionFunction={updateFunction}/>,
        $("#popup-container")[0]
    );
}
export function closeMessageBox(){
    // reactDom.render(null,$("#popup-container")[0]);
    reactDom.unmountComponentAtNode($("#popup-container")[0]);
}
