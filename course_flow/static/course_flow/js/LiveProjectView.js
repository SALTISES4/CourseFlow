import * as React from "react";
import * as reactDom from "react-dom";
import {WorkflowTitle} from "./ComponentJSON";
import {WorkflowForMenu,renderMessageBox,closeMessageBox} from "./MenuComponents";
import {getLiveProjectData} from "./PostFunctions";

export class LiveProjectMenu extends React.Component{
    constructor(props){
        super(props);
        this.state={...props.project,view_type:"overview"};
    }
    
    render(){
        let data = this.props.project;

        let view_buttons = [
            {type:"overview",name:gettext("Classroom Overview")},
            {type:"students",name:gettext("Students")},
            {type:"assignments",name:gettext("Assignments")},
            {type:"settings",name:gettext("Classroom Settings")},
        ].map(
            (item)=>{
                let view_class = "hover-shade";
                if(item.type==this.state.view_type)view_class += " active";
                return <div id={"button_"+item.type} class={view_class} onClick = {this.changeView.bind(this,item.type)}>{item.name}</div>;
            }
        );

        let content = this.getContent();

        let share;
        if(!read_only)share = <div id="share-button" class="floatbardiv" onClick={renderMessageBox.bind(this,this.props.project,"share_menu",closeMessageBox)}><img src={iconpath+"add_person.svg"}/><div>{gettext("Sharing")}</div></div>
        
        let publish_icon = iconpath+'view_none.svg';
        let publish_text = gettext("PRIVATE");
        if(this.props.project.published){
            publish_icon = iconpath+'published.svg';
            publish_text = gettext("PUBLISHED");
        }

        let view_project=(
            <a class="menu-create hover-shade" href={update_path.project.replace("0",this.state.id)}>{gettext("Design Mode")}</a>
        );
        
        return(
            <div class="project-menu">
                <div class="project-header">
                    {reactDom.createPortal(
                        <div>{this.state.title||gettext("Unnamed Project")}</div>,
                        $("#workflowtitle")[0]
                    )}
                    <WorkflowForMenu workflow_data={this.state} selectAction={this.openEdit.bind(this)}/>
                    {view_project}
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
                    
                    {this.props.project.author_id==user_id  &&
                        reactDom.createPortal(
                            <div class="hover-shade" id="edit-project-button" onClick ={ this.openEdit.bind(this)}>
                                <img src={iconpath+'edit_pencil.svg'} title={gettext("Edit Project")}/>
                            </div>,
                            $("#viewbar")[0]
                        )
                    }

                    
                </div>

                <div class="workflow-view-select hide-print">
                    {view_buttons}
                </div>
                <div class = "workflow-container">
                    {content}
                </div>
            </div>
        );
    }
    
    openEdit(){
        renderMessageBox({...this.state,id:this.props.project.id},"project_edit_menu",this.updateFunction.bind(this));
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

    getContent(){
        console.log(this.props)
        switch(this.state.view_type){
            case "overview":
                return (<LiveProjectOverview objectID={this.props.project.id} view_type={this.state.view_type}/>);
            case "students":
                return (<LiveProjectStudents objectID={this.props.project.id} view_type={this.state.view_type}/>);
            case "assignments":
                return (<LiveProjectAssignments objectID={this.props.project.id} view_type={this.state.view_type}/>);
            case "settings":
                return (<LiveProjectSettings objectID={this.props.project.id} view_type={this.state.view_type}/>);
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
        getLiveProjectData(this.props.objectID,this.props.view_type,
            (data_package)=>{
                component.setState({data:data_package});
            }
        )
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

class LiveProjectAssignments extends LiveProjectSection{

    render(){
        if(!this.state.data)return this.defaultRender();
        console.log(this.state);
        return (
            <div>Got data</div>
        );
    }

}

class LiveProjectStudents extends LiveProjectSection{

    render(){
        if(!this.state.data)return this.defaultRender();
        console.log(this.state);
        return (
            <div>Got data</div>
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