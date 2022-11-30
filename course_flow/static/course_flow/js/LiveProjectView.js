import * as React from "react";
import * as reactDom from "react-dom";
import {WorkflowTitle, NodeTitle, TitleText, ActionButton} from "./ComponentJSON";
import {WorkflowForMenu,renderMessageBox,closeMessageBox} from "./MenuComponents";
import {createAssignment, getLiveProjectData, getLiveProjectDataStudent, setWorkflowVisibility, getWorkflowNodes} from "./PostFunctions";
import {StudentManagement} from "./StudentManagement";
import {AssignmentView} from "./LiveAssignmentView";
import * as Constants from "./Constants";

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
                return <a id={"button_"+item.type} class={view_class} onClick = {this.changeView.bind(this,item.type)}>{item.name}</a>;
            }
        );


        return(
            <div class="project-menu">
                <div class="project-header">
                    <WorkflowForMenu no_hyperlink={true} workflow_data={this.props.liveproject} selectAction={this.openEdit.bind(this)}/>
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
    }

    changeView(view_type){
        this.setState({view_type:view_type});
    }
    
    componentDidMount(){
    }

    getHeader(){
        return null;
    }

    getContent(){
        switch(this.state.view_type){
            case "overview":
                return (<LiveProjectOverview renderer={this.props.renderer} role={this.getRole()} objectID={this.props.project.id} view_type={this.state.view_type}/>);
            case "students":
                return (<LiveProjectStudents renderer={this.props.renderer} role={this.getRole()} liveproject={this.props.liveproject} objectID={this.props.project.id} view_type={this.state.view_type}/>);
            case "assignments":
                return (<LiveProjectAssignments renderer={this.props.renderer} role={this.getRole()} objectID={this.props.project.id} view_type={this.state.view_type}/>);
            case "workflows":
                return (<LiveProjectWorkflows renderer={this.props.renderer} role={this.getRole()} objectID={this.props.project.id} view_type={this.state.view_type}/>);
            case "settings":
                return (<LiveProjectSettings renderer={this.props.renderer} role={this.getRole()} objectID={this.props.project.id} view_type={this.state.view_type}/>);
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

    getRole(){
        return "student";
    }
    getContent(){
        switch(this.state.view_type){
            case "overview":
                return (<StudentLiveProjectOverview renderer={this.props.renderer} role={this.getRole()} objectID={this.props.project.id} view_type={this.state.view_type}/>);
            case "assignments":
                return (<StudentLiveProjectAssignments renderer={this.props.renderer} role={this.getRole()} objectID={this.props.project.id} view_type={this.state.view_type}/>);
            case "workflows":
                return (<StudentLiveProjectWorkflows renderer={this.props.renderer} role={this.getRole()} objectID={this.props.project.id} view_type={this.state.view_type}/>);
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
        return (
            <div>Not yet implemented</div>
        );
    }

}

class StudentLiveProjectOverview extends LiveProjectSection{

    render(){
        if(!this.state.data)return this.defaultRender();
        return (
            <div>Not yet implemented</div>
        );
    }

}

class LiveProjectAssignments extends LiveProjectSection{

    render(){
        if(!this.state.data)return this.defaultRender();
        let assignments = this.state.data.assignments.map(assignment=>
            <AssignmentView renderer={this.props.renderer} data={assignment}/>
        );
        let workflow_options = this.state.data.workflows.map(
            (workflow)=>{
                let view_class = "hover-shade";
                if(workflow.id==this.state.selected_id)view_class += " active";
                return <div id={"button_"+workflow.id} class={view_class} onClick = {this.changeView.bind(this,workflow.id)}><WorkflowTitle no_hyperlink={true} data={workflow}/></div>;
            }
        );
        let workflow_nodes;
        if(this.state.selected_id){
            workflow_nodes=<AssignmentWorkflowNodesDisplay renderer={this.props.renderer} objectID={this.state.selected_id}/>
        }

        return (
            <div class="workflow-details">
                <h3>{gettext("Assigned Tasks")}</h3>
                <div>
                    {assignments}
                </div>
                <h3>{gettext("All Tasks")}</h3>
                <div id="select-workflow" class="workflow-view-select">
                    {workflow_options}
                </div>
                {workflow_nodes}
            </div>
        );
    }

    changeView(workflow_id){
        this.setState({selected_id:workflow_id})
    }

}

class AssignmentWorkflowNodesDisplay extends React.Component{
    constructor(props){
        super(props)
        this.state={};
    }

    render(){
        if(!this.state.data)return this.defaultRender();
        let weeks = this.state.data.weeks.map((week,i)=>{
            let nodes = week.nodes.map(node=>
                <AssignmentNode renderer={this.props.renderer} data={node}/>
            );
            let default_text;
            default_text = week.week_type_display+" "+(i+1);
            return(
                <div class="week">
                    <TitleText text={week.title} defaultText={default_text}/>
                    <div class="node-block-grid">
                        {nodes}
                    </div>
                </div>
            )
        });
        return (
            <div>
                {weeks}
            </div>
        );
    }

    componentDidMount(){
        this.getData();
    }

    getData(){
        let component = this;
        getWorkflowNodes(this.props.objectID,
            (data)=>{
                component.setState({data:data.data_package});
            }
        )
    }

    componentDidUpdate(prevProps){
        if(prevProps.objectID!=this.props.objectID){
            this.setState({data:null},this.getData.bind(this));
        }
    }

    defaultRender(){
        return (<renderers.WorkflowLoader/>);
    }
}

class AssignmentNode extends React.Component{
    render(){
        let data = this.props.data;
        let lefticon;
        let righticon;
        if(data.context_classification>0)lefticon=(
            <img title={
                renderer.context_choices.find(
                    (obj)=>obj.type==data.context_classification
                ).name
            } src={iconpath+Constants.context_keys[data.context_classification]+".svg"}/>
        )
        if(data.task_classification>0)righticon=(
            <img title={
                renderer.task_choices.find(
                    (obj)=>obj.type==data.task_classification
                ).name
            }src={iconpath+Constants.task_keys[data.task_classification]+".svg"}/>
        )
        let style = {backgroundColor:Constants.getColumnColour(this.props.data)};
        let mouseover_actions = [this.addCreateAssignment(data)];

        return (
            <div style={style} class="node">
                <div class="mouseover-actions">
                    {mouseover_actions}
                </div>
                <div class = "node-top-row">
                    <div class = "node-icon">
                        {lefticon}
                    </div>
                    <NodeTitle data={this.props.data}/>
                    <div class = "node-icon">
                        {righticon}
                    </div>
                </div>
                <div class="node-drop-row">

                </div>
            </div>
        )
    }

    addCreateAssignment(data){
        return (
            <ActionButton button_icon="assignment.svg" button_class="duplicate-self-button" titletext={gettext("Create Assignment")} handleClick={this.createAssignment.bind(this,data)}/>
        );
    }

    createAssignment(data){
        let props = this.props;
        props.renderer.tiny_loader.startLoad();
        createAssignment(
            data.id,
            props.renderer.live_project_data.pk,
            (response_data)=>{
                props.renderer.tiny_loader.endLoad();
                window.location = update_path.liveassignment.replace("0",response_data.assignmentPk);
            }
        );
    }

}

class StudentLiveProjectAssignments extends LiveProjectSection{

    render(){
        if(!this.state.data)return this.defaultRender();
        let assignments_past = this.state.data.assignments_past.map(assignment=>
            <AssignmentView renderer={this.props.renderer} data={assignment}/>
        );
        let assignments_upcoming = this.state.data.assignments_upcoming.map(assignment=>
            <AssignmentView renderer={this.props.renderer} data={assignment}/>
        );

        return (
            <div class="workflow-details">
                <h3>{gettext("Your Tasks")}:</h3>
                <h4>{gettext("Upcoming")}:</h4>
                <div>
                    {assignments_upcoming}
                </div>
                <h4>{gettext("Past")}:</h4>
                <div>
                    {assignments_past}
                </div>
            </div>
        );
    }

}

class LiveProjectWorkflows extends LiveProjectSection{

    render(){
        if(!this.state.data)return this.defaultRender();
        let workflows_added = this.state.data.workflows_added.map(workflow=>
            <WorkflowVisibility workflow_data={workflow} visibility="visible" visibilityFunction={this.switchVisibility.bind(this)}/>
        );
        let workflows_not_added = this.state.data.workflows_not_added.map(workflow=>
            <WorkflowVisibility workflow_data={workflow} visibility="not_visible" visibilityFunction={this.switchVisibility.bind(this)}/>
        );
        return (
            <div class="workflow-details">
                <h3>{gettext("Visible Workflows")}</h3>
                <div class="menu-grid">
                    {workflows_added}
                </div>
                <h3>{gettext("Other Workflows")}</h3>
                <div class="menu-grid">
                    {workflows_not_added}
                </div>
            </div>
        );
    }

    switchVisibility(pk,visibility){
        let workflows_added=this.state.data.workflows_added.slice()
        let workflows_not_added=this.state.data.workflows_not_added.slice()
        if(visibility=="visible"){
            for(let i=0;i<workflows_not_added.length;i++){
                if(workflows_not_added[i].id==pk){
                    let removed = workflows_not_added.splice(i,1);
                    setWorkflowVisibility(this.props.objectID,pk,true)
                    workflows_added.push(removed[0]);
                }
            }
        }else{
            for(let i=0;i<workflows_added.length;i++){
                if(workflows_added[i].id==pk){
                    let removed = workflows_added.splice(i,1);
                    setWorkflowVisibility(this.props.objectID,pk,false)
                    workflows_not_added.push(removed[0]);
                }
            }
        }
        this.setState({data:{...this.state.data,workflows_added:workflows_added,workflows_not_added:workflows_not_added}});

    }

}

class StudentLiveProjectWorkflows extends LiveProjectSection{

    render(){
        if(!this.state.data)return this.defaultRender();
        let workflows_added = this.state.data.workflows_added.map(workflow=>
            <WorkflowForMenu workflow_data={workflow}/>
        );
        return (
            <div class="workflow-details">
                <h3>{gettext("Workflows")}</h3>
                <div class="menu-grid">
                    {workflows_added}
                </div>
            </div>
        );
    }

}

class LiveProjectStudents extends React.Component{

    render(){
        let liveproject = this.props.liveproject;

        let register_link;
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
        return (
            <div>Not yet implemented</div>
        );
    }

}



export class WorkflowVisibility extends WorkflowForMenu{
    
    render(){
        var data = this.props.workflow_data;
        var css_class = "workflow-for-menu workflow-visibility hover-shade "+data.type;
        if(this.props.selected)css_class+=" selected";
        if(this.state.hide)return null;
        let creation_text = gettext("Created");
        if(data.author && data.author !="None")creation_text+=" "+gettext("by")+" "+data.author;
        creation_text+=" "+data.created_on;
        
        return(
            <div ref={this.maindiv} class={css_class}>
                <div class="workflow-top-row">
                    <WorkflowTitle class_name="workflow-title" data={data}/>
                    {this.getButtons()}
                    {this.getTypeIndicator()}
                </div>
                <div class="workflow-created">
                    { creation_text}
                </div>
                <div class="workflow-description" dangerouslySetInnerHTML={{ __html: data.description }}>
                </div>
            </div>
        );
    }
    
    
    clickAction(){
        return null;
    }


    getButtons(){
        return (
            <div class="permission-select">
                <select value={this.props.visibility} onChange={(evt)=>this.props.visibilityFunction(this.props.workflow_data.id,evt.target.value)}>
                    <option value="not_visible">{gettext("Not Visible")}</option>
                    <option value="visible">{gettext("Visible")}</option>
                </select>
            </div>
        );
    }
}