import * as Redux from "redux";
import * as React from "react";
import * as reactDom from "react-dom";
import {Provider, connect} from "react-redux";
import {updateValueInstant, deleteSelf, setLinkedWorkflow, duplicateBaseItem} from "./PostFunctions.js";
import {homeMenuItemAdded} from "./Reducers.js";
import {Loader} from "./Constants.js";

export class MessageBox extends React.Component{
    render(){
        var menu;
        if(this.props.message_type=="linked_workflow_menu")menu=(
            <WorkflowsMenu type={this.props.message_type} data={this.props.message_data} actionFunction={this.props.actionFunction}/>
        );
        if(this.props.message_type=="project_edit_menu")menu=(
            <ProjectEditMenu type={this.props.message_type} data={this.props.message_data} actionFunction={this.props.actionFunction}/>
        );
        return(
            <div class="screen-barrier" onClick={(evt)=>evt.stopPropagation()}>
                <div class="message-box">
                    {menu}
                </div>
            </div>
        );
    }
}


export class WorkflowsMenu extends React.Component{
    constructor(props){
        super(props);
        this.state={};
        this.project_workflows = props.data.data_package.current_project.sections[0].objects.map((object)=>object.id);
    }
    
    render(){
        var data_package = this.props.data.data_package;
        
        var tabs = [];
        var tab_li = [];
        var i = 0;
        for(var prop in data_package){
            tab_li.push(
                <li class="tab-header"><a href={"#tabs-"+i}>{data_package[prop].title}</a></li>
            )
            tabs.push(
                <MenuTab data={data_package[prop]} type={this.props.type} identifier={i} selected_id={this.state.selected} selectAction={this.workflowSelected.bind(this)}/>
            )
            i++;
        }
        return(
            <div class="message-wrap">
                <div class="home-tabs" id="home-tabs">
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
    
    workflowSelected(selected_id,selected_type){
        this.setState({selected:selected_id,selected_type:selected_type});
    }

    getActions(){
        var actions = [];
        if(this.props.type=="linked_workflow_menu"){
            var text="link to node";
            if(this.state.selected && this.project_workflows.indexOf(this.state.selected)<0)text="copy to current project and "+text;
            actions.push(
                <button disabled={!this.state.selected} onClick={()=>{
                    setLinkedWorkflow(this.props.data.node_id,this.state.selected,this.props.actionFunction)
                    closeMessageBox();
                }}>
                    {text}
                </button>
            );
            actions.push(
                <button onClick={()=>{
                    setLinkedWorkflow(this.props.data.node_id,-1,this.props.actionFunction)
                    closeMessageBox();
                }}>
                    set to none
                </button>
            );
            actions.push(
                <button onClick={closeMessageBox}>
                    cancel
                </button>
            );
        }
        return actions;
    }
    
    componentDidMount(){
        $("#home-tabs").tabs();
        $(".tab-header").on("click",()=>{this.setState({selected:null})})
    }
}

export class WorkflowForMenu extends React.Component{
    constructor(props){
        super(props);
        this.state={};
    }
    
    render(){
        var data = this.props.workflow_data;
        var css_class = "workflow-for-menu";
        if(this.props.selected)css_class+=" selected";
        if(this.state.hide)return null;
        return(
            <div class={css_class} onClick={this.props.selectAction}>
                <div class="workflow-top-row">
                    <div class="workflow-title">
                        {data.title}
                    </div>
                    {this.getButtons()}
                </div>
                <div class="workflow-created">
                    { "Created"+(data.author && " by "+data.author)+" on "+data.created_on}
                </div>
                <div class="activity-description">
                    {data.description}
                </div>
            </div>
        );
    }
    
    getButtons(){
        var buttons=[];
        if(this.props.type=="projectmenu"||this.props.type=="homemenu"){
            if(this.props.owned){
                console.log(this.props);
                buttons.push(
                    <div onClick={(evt)=>{
                        if(window.confirm("Are you sure you want to delete this? All contents will be deleted, and this action cannot be undone.")){
                            deleteSelf(this.props.workflow_data.id,this.props.objectType);
                            this.setState({hide:true});
                        }
                    }}>
                        <img src={iconpath+'rubbish.svg'} title="Delete"/>
                    </div>
                );
                buttons.push(
                    <a href={update_path[this.props.objectType].replace("0",this.props.workflow_data.id)}>
                        <img src={iconpath+'edit_pencil.svg'} title="Edit"/>
                    </a>
                );
            }else{
                buttons.push(
                    <a href={detail_path[this.props.objectType].replace("0",this.props.workflow_data.id)}>
                        <img src={iconpath+'page_view.svg'} title="View"/>
                    </a>
                );
            }
            if(this.props.duplicate){
                console.log(this.props);
                let icon;
                let titletext;
                if(this.props.duplicate=="copy"){
                    icon = 'duplicate.svg';
                    titletext="Duplicate";
                }
                else {
                    icon = 'import.svg';
                    if(this.props.type=="projectmenu")titletext="Import to current project";
                    else titletext="Import to my files";
                }
                buttons.push(
                    <div onClick={()=>{
                        let loader = new Loader('body');
                        duplicateBaseItem(this.props.workflow_data.id,this.props.objectType,this.props.parentID,(response_data)=>{this.props.dispatch(homeMenuItemAdded(response_data));loader.endLoad();})
                    }}>
                        <img src={iconpath+icon} title={titletext}/>
                    </div>
                );
            }
        }
        return (
            <div class="workflow-buttons">
                {buttons}
            </div>
        );
    }
}


export class MenuSection extends React.Component{
    render(){
        var objects = this.props.section_data.objects.map((object)=>
            <WorkflowForMenu key={object.id} type={this.props.type} owned={(object.author_id==user_id)} workflow_data={object} objectType={this.props.section_data.object_type} selected={(this.props.selected_id==object.id)}  dispatch={this.props.dispatch} selectAction={()=>{this.props.selectAction(object.id)}} parentID={this.props.parentID} duplicate={this.props.duplicate}/>                            
        );
        
        
        if(objects.length==0)objects="This category is currently empty."

        return (
            <div>
                <h3>{this.props.section_data.title+":"}
                {(create_path && this.props.add) &&
                  <a href={create_path[this.props.section_data.object_type]}
                    ><img
                      class="create-button link-image" title="Add New"
                      src={iconpath+"add_new.svg"}
                  /></a>
                }
                </h3>
                {objects}
            </div>
        );
        
    }
}

export class MenuTab extends React.Component{
    render(){
        var sections = this.props.data.sections.map((section)=>
            <MenuSection type={this.props.type} section_data={section} add={this.props.data.add} selected_id={this.props.selected_id} dispatch={this.props.dispatch} selectAction={this.props.selectAction} parentID={this.props.parentID} duplicate={this.props.data.duplicate}/>
        );
        
        return (
            <div id={"tabs-"+this.props.identifier}>
                <h2>{this.props.data.title}</h2>
                {sections}
            </div>
        );
    }
}

class HomeMenuUnconnected extends React.Component{
    render(){
        console.log(this.props);
        var tabs = [];
        var tab_li = [];
        var i = 0;
        for(var prop in this.props.data_package){
            tab_li.push(
                <li><a href={"#tabs-"+i}>{this.props.data_package[prop].title}</a></li>
            )
            tabs.push(
                <MenuTab data={this.props.data_package[prop]} dispatch={this.props.dispatch} type="homemenu" identifier={i}/>
            )
            i++;
        }
        return(
            <div class="home-tabs" id="home-tabs">
                <ul>
                    {tab_li}
                </ul>
                {tabs}
            </div>
        );
        
    }
    
    componentDidMount(){
        $("#home-tabs").tabs();
    }
}
export const HomeMenu = connect(
    state=>({data_package:state}),
    null
)(HomeMenuUnconnected)


class ProjectMenuUnconnected extends React.Component{
    constructor(props){
        super(props);
        this.state={title:props.project.title,description:props.project.description,published:props.project.published};
    }
    
    render(){
        var tabs = [];
        var tab_li = [];
        var i = 0;
        for(var prop in this.props.data_package){
            tab_li.push(
                <li><a href={"#tabs-"+i}>{this.props.data_package[prop].title}</a></li>
            )
            tabs.push(
                <MenuTab data={this.props.data_package[prop]} dispatch={this.props.dispatch} type="projectmenu" identifier={i} parentID={this.props.project.id}/>
            )
            i++;
        }
        return(
            <div class="project-menu">
                <div class="project-header">
                    <h2>{this.state.title} {this.props.project.author_id==user_id  &&
                        <a class="action-button" onClick ={ this.openEdit.bind(this)}>
                            <img src={iconpath+'edit_pencil.svg'} title="Edit Project"/>
                        </a>
                    }</h2>
                    <p>{this.state.description}</p>
                    {this.state.published &&
                        <p>{"This project has been published and is visibile to all"}</p>
                    }
                    {!this.state.published &&
                        <p>{"This project has not been published, only you can see it"}</p>
                    }
                </div>
                <div class="home-tabs" id="home-tabs">
                    <ul>
                        {tab_li}
                    </ul>
                    {tabs}
                </div>
            </div>
        );
    }
    
    openEdit(){
        renderMessageBox({...this.state,id:this.props.project.id},"project_edit_menu",this.updateFunction.bind(this));
    }
    
    componentDidMount(){
        $("#home-tabs").tabs();
    }

    updateFunction(new_state){
        this.setState(new_state);
    }
}
export const ProjectMenu = connect(
    state=>({data_package:state}),
    null
)(ProjectMenuUnconnected)


export class ProjectEditMenu extends React.Component{
    constructor(props){
        super(props);
        this.state=props.data;
    }
    
    render(){
        var data = this.state;
        
        return(
            <div class="message-wrap">
                <h3>{"Edit Project:"}</h3>
                <div>
                    <h4>Title:</h4>
                    <input value={data.title} onChange={this.inputChanged.bind(this,"title")}/>
                </div>
                <div>
                    <h4>Description:</h4>
                    <input value={data.description} onChange={this.inputChanged.bind(this,"description")}/>
                </div>
                <div>
                    <h4>Published:</h4>
                    <input type="checkbox" name="published" checked={data.published} onChange={this.checkboxChanged.bind(this,"published")}/>
                    <label for="published">Is Published (visible to all users)</label>
                </div>
                <div class="action-bar">
                    {this.getActions()}
                </div>
            </div>
        );
    }
    
    
    inputChanged(field,evt){
        var new_state={}
        new_state[field]=evt.target.value;
        this.setState(new_state);
    }

    
    checkboxChanged(field,evt){
        if(field=="published"){
            if(!this.state.published && !window.confirm("Are you sure you want to publish this project, making it fully visible to anyone with an account?")){
                return;
            }else if(this.state.published && !window.confirm("Are you sure you want to unpublish this project, rendering it hidden to all other users?")){
                return;
            }
        }
        var new_state={}
        new_state[field]=evt.target.checked;
        this.setState(new_state);
    }

    getActions(){
        var actions = [];
        actions.push(
            <button onClick={()=>{
                updateValueInstant(this.state.id,"project",this.state);
                if(this.state.published!=this.props.data.published)togglePublish();
                this.props.actionFunction(this.state);
                closeMessageBox();
            }}>
                Save Changes
            </button>
        );
        actions.push(
            <button onClick={closeMessageBox}>
                cancel
            </button>
        );
        return actions;
    }
}


export function renderMessageBox(data,type,updateFunction){
    reactDom.render(
        <MessageBox message_data={data} message_type={type} actionFunction={updateFunction}/>,
        $("#popup-container")[0]
    );
}



export function closeMessageBox(){
    reactDom.render(null,$("#popup-container")[0]);
}

