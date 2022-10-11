import * as React from "react";
import * as reactDom from "react-dom";
import {WorkflowTitle} from "./ComponentJSON";
import {WorkflowForMenu,renderMessageBox,closeMessageBox} from "./MenuComponents";
import {getLiveProjectData, getLiveProjectDataStudent} from "./PostFunctions";
import {StudentManagement} from "./StudentManagement";

export class LiveProjectMenu extends React.Component{
    constructor(props){
        super(props);
        this.state={...props.project,view_type:"overview"};
    }
    
    render(){
        let data = this.props.project;

        let view_buttons = this.getViewButtons().map(
            (item)=>{
                let view_class = "hover-shade";
                if(item.type==this.state.view_type)view_class += " active";
                return <div id={"button_"+item.type} class={view_class} onClick = {this.changeView.bind(this,item.type)}>{item.name}</div>;
            }
        );


        return(
            <div class="project-menu">
                <div class="project-header">
                    {reactDom.createPortal(
                        <div>{this.state.title||gettext("Unnamed Project")}</div>,
                        $("#workflowtitle")[0]
                    )}
                    <WorkflowForMenu workflow_data={this.props.liveproject} selectAction={this.openEdit.bind(this)}/>
                    {this.getHeader()}
                    
                </div>

                <div class="workflow-view-select hide-print">
                    {view_buttons}
                </div>
                <div class = "workflow-container">
                    {this.getContent()}
                </div>
            </div>
        );
    }

    getViewButtons(){
        return [
            {type:"overview",name:gettext("Classroom Overview")},
            {type:"students",name:gettext("Students")},
            {type:"assignments",name:gettext("Assignments")},
            {type:"workflows",name:gettext("Workflow Visibility")},
            {type:"settings",name:gettext("Classroom Settings")},
        ];
    }
    
    getRole(){
        return "teacher";
    }

    openEdit(){
        return null;
        // renderMessageBox({...this.state,id:this.props.project.id},"project_edit_menu",this.updateFunction.bind(this));
    }

    changeView(view_type){
        this.setState({view_type:view_type});
    }
    
    componentDidMount(){
        $("#home-tabs").tabs({
            activate:(evt,ui)=>{
                window.location.hash=ui.newPanel[0].id;
            }
        });
    }

    getHeader(){
        // let publish_icon = iconpath+'view_none.svg';
        // let publish_text = gettext("PRIVATE");
        // if(this.props.project.published){
        //     publish_icon = iconpath+'published.svg';
        //     publish_text = gettext("PUBLISHED");
        // }
        // let share;
        // if(!read_only)share = <div id="share-button" class="floatbardiv" onClick={renderMessageBox.bind(this,this.props.project,"share_menu",closeMessageBox)}><img src={iconpath+"add_person.svg"}/><div>{gettext("Sharing")}</div></div>
        // let edit_project;
        // if(this.props.project.author_id==user_id)edit_project=reactDom.createPortal(
        //     <div class="hover-shade" id="edit-project-button" onClick ={ this.openEdit.bind(this)}>
        //         <img src={iconpath+'edit_pencil.svg'} title={gettext("Edit Project")}/>
        //     </div>,
        //     $("#viewbar")[0]
        // );
        // return [
        //     reactDom.createPortal(
        //         share,
        //         $("#floatbar")[0]
        //     ),
        //     reactDom.createPortal(
        //         <div class="workflow-publication">
        //             <img src={publish_icon}/><div>{publish_text}</div>
        //         </div>,
        //         $("#floatbar")[0]
        //     ),
        //     // edit_project,
        //     <a class="menu-create hover-shade" href={update_path.project.replace("0",this.state.id)}>{gettext("Design Mode")}</a>,
        // ];
    }

    getContent(){
        console.log(this.props)
        switch(this.state.view_type){
            case "overview":
                return (<LiveProjectOverview role={this.getRole()} objectID={this.props.project.id} view_type={this.state.view_type}/>);
            case "students":
                return (<LiveProjectStudents role={this.getRole()} liveproject={this.props.liveproject} objectID={this.props.project.id} view_type={this.state.view_type}/>);
            case "assignments":
                return (<LiveProjectAssignments role={this.getRole()} objectID={this.props.project.id} view_type={this.state.view_type}/>);
            case "workflows":
                return (<LiveProjectWorkflows role={this.getRole()} objectID={this.props.project.id} view_type={this.state.view_type}/>);
            case "settings":
                return (<LiveProjectSettings role={this.getRole()} objectID={this.props.project.id} view_type={this.state.view_type}/>);
        }
    }

    updateFunction(new_state){
        this.setState(new_state);
    }

                     
}
export class StudentLiveProjectMenu extends LiveProjectMenu{

    getViewButtons(){
        return [
            {type:"overview",name:gettext("Classroom Overview")},
            {type:"assignments",name:gettext("My Assignments")},
            {type:"workflows",name:gettext("My Workflows")},
        ];
    }

    getHeader(){
        return null;
    }

    getRole(){
        return "student";
    }
    getContent(){
        console.log(this.props)
        switch(this.state.view_type){
            case "overview":
                return (<StudentLiveProjectOverview role={this.getRole()} objectID={this.props.project.id} view_type={this.state.view_type}/>);
            case "assignments":
                return (<StudentLiveProjectAssignments role={this.getRole()} objectID={this.props.project.id} view_type={this.state.view_type}/>);
            case "workflows":
                return (<StudentLiveProjectWorkflows role={this.getRole()} objectID={this.props.project.id} view_type={this.state.view_type}/>);
        }
    }

    updateFunction(new_state){
        this.setState(new_state);
    }

                     
}



class LiveProjectSection extends React.Component{
    constructor(props){
        super(props);
        this.state={};
    }

    defaultRender(){
        return (<renderers.WorkflowLoader/>);
    }

    componentDidMount(){
        let component = this;
        if(this.props.role=="teacher"){
            getLiveProjectData(this.props.objectID,this.props.view_type,
                (data)=>{
                    component.setState({data:data.data_package});
                }
            )
        }else if(this.props.role=="student"){
            getLiveProjectDataStudent(this.props.objectID,this.props.view_type,
                (data)=>{
                    component.setState({data:data.data_package});
                }
            )
        }
    }
}

class LiveProjectOverview extends LiveProjectSection{

    render(){
        if(!this.state.data)return this.defaultRender();
        console.log(this.state);
        return (
            <div>Got data</div>
        );
    }

}

class StudentLiveProjectOverview extends LiveProjectSection{

    render(){
        if(!this.state.data)return this.defaultRender();
        console.log(this.state);
        return (
            <div>Got data</div>
        );
    }

}

class LiveProjectAssignments extends LiveProjectSection{

    render(){
        if(!this.state.data)return this.defaultRender();
        console.log(this.state);
        return (
            <div>Got data</div>
        );
    }

}

class StudentLiveProjectAssignments extends LiveProjectSection{

    render(){
        if(!this.state.data)return this.defaultRender();
        console.log(this.state);
        return (
            <div>Got data</div>
        );
    }

}

class LiveProjectWorkflows extends LiveProjectSection{

    render(){
        if(!this.state.data)return this.defaultRender();
        console.log(this.state.data);
        let workflows_added = this.state.data.workflows_added.map(workflow=>
            <WorkflowForMenu workflow_data={workflow}/>
        );
        let workflows_not_added = this.state.data.workflows_not_added.map(workflow=>
            <WorkflowForMenu workflow_data={workflow}/>
        );
        return (
            <div>
                {workflows_added}
                {workflows_not_added}
            </div>
        );
    }

}

class StudentLiveProjectWorkflows extends LiveProjectSection{

    render(){
        if(!this.state.data)return this.defaultRender();
        console.log(this.state);
        let workflows_added = this.state.data.workflows_added.map(workflow=>
            <WorkflowForMenu workflow_data={workflow}/>
        );
        return (
            <div>
                {workflows_added}
            </div>
        );
    }

}

class LiveProjectStudents extends React.Component{

    render(){
        let liveproject = this.props.liveproject;

        let register_link;
        console.log(liveproject);
        if(liveproject && liveproject.registration_hash){
            let register_url = registration_path.replace("project_hash",liveproject.registration_hash);
            register_link = (
                <div class="user-text">
                    <div class="user-panel">
                        <h4>Student Registration:</h4>
                        <p>
                            {gettext("Student Registration Link: ")}
                        </p>
                        <div>
                            <img id="copy-text" class="hover-shade" onClick={
                                ()=>{
                                    navigator.clipboard.writeText(register_url);
                                    $("#copy-text").attr("src",iconpath+"duplicate_checked.svg");
                                    $("#url-text").text("Copied to Clipboard");
                                    setTimeout(()=>{
                                        $("#copy-text").attr("src",iconpath+"duplicate_clipboard.svg");
                                        $("#url-text").text(register_url);
                                    },1000)
                                }
                            } title={gettext("Copy to clipboard")} src={iconpath+"duplicate_clipboard.svg"}/>
                            <a id="url-text" class="selectable" href={register_url}>
                                {register_url}
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div class="workflow-details">
                <StudentManagement data={this.props.liveproject}/>
                {register_link}
            </div>
        );
    }

}

class LiveProjectSettings extends LiveProjectSection{

    render(){
        if(!this.state.data)return this.defaultRender();
        console.log(this.state);
        return (
            <div>Got data</div>
        );
    }

}


