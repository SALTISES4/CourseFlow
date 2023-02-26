import * as Redux from "redux";
import * as React from "react";
import * as reactDom from "react-dom";
import {setUserPermission,getUsersForObject,getUserList,updateValueInstant} from "./PostFunctions";
import {WorkflowTitle} from "./ComponentJSON";
import * as Constants from "./Constants";

export class ShareMenu extends React.Component{
    constructor(props){
        super(props);
        this.tiny_loader = new renderers.TinyLoader($("body"));
        this.state={owner:props.data.author,edit:[],view:[],comment:[],student:[],userlist:[]}
    }
    
    render(){
        let data = this.props.data
        let owner = (
            <UserLabel user={this.state.owner} type={"owner"}/>
        );
        let editors = this.state.edit.filter(user=>user.id!=this.state.owner.id).map((user)=>
            <UserLabel user={user} type={"edit"} permissionChange={this.setUserPermission.bind(this)}/>
        );
        let viewers = this.state.view.map((user)=>
            <UserLabel user={user} type={"view"} permissionChange={this.setUserPermission.bind(this)}/>
        );
        let commentors = this.state.comment.map((user)=>
            <UserLabel user={user} type={"comment"} permissionChange={this.setUserPermission.bind(this)}/>
        );
        let students = this.state.student.map((user)=>
            <UserLabel user={user} type={"student"} permissionChange={this.setUserPermission.bind(this)}/>
        );

        let share_info;
        if(data.type=="project"){
            share_info=gettext("Note: You are sharing a project. Any added users will be granted the same permission for all workflows within the project.");
        }else{
            share_info=gettext("Note: You are sharing a workflow. Any added users will be granted view permissions for the whole project.");
        }
        console.log(data);

        return(
            <div class="message-wrap user-text">
                <div class="workflow-title-bar">
                    {gettext("Share")+" "+gettext(data.type)}
                    <WorkflowTitle no_hyperlink={true} data={this.props.data}/>
                </div>
                {this.getPublication()}
                <h4>{gettext("Owned By")}:</h4>
                    <div>{owner}</div>
                <div class="user-panel">
                    <h4>{gettext("Shared With")}:</h4>
                    <ul class="user-list">
                        {editors}
                        {commentors}
                        {viewers}
                        {students}
                    </ul>
                </div>
                <UserAdd permissionChange={this.setUserPermission.bind(this)}/>
                {share_info}
                <div class="window-close-button" onClick = {this.props.actionFunction}>
                    <img src = {iconpath+"close.svg"}/>
                </div>
            </div>
        );
        
    }

    getPublication(){
        let published=this.state.published;
        let data=this.props.data;
        if(data.type=="workflow")return null;
        let public_class="big-button";
        let private_class="big-button hover-shade";
        if(published)public_class+=" active";
        else private_class+=" active";
        let public_disabled = !(data.disciplines.length>0 && data.title && data.title.length>0);
        if(!public_disabled && !published)public_class+=" hover-shade";
        if(public_disabled)public_class+=" disabled";
        let public_text=gettext("Any CourseFlow teacher can view");
        if(public_disabled)public_text+=gettext("\n\nA title and at least one discipline is required for publishing.")
        return (
            <div class="big-buttons-wrapper">
                <div class={public_class} disabled={public_disabled} onClick={this.setPublication.bind(this,true && !public_disabled)}>
                    <span class="material-symbols-rounded">public</span>
                    <div class="big-button-title">{gettext("Public to CourseFlow")}</div>
                    <div class="big-button-description">{public_text}</div>
                </div>
                <div class={private_class} onClick={this.setPublication.bind(this,false)}>
                    <span class="material-symbols-rounded">visibility_off</span>
                    <div class="big-button-title">{gettext("Private")}</div>
                    <div class="big-button-description">{gettext("Only added collaborators can view")}</div>
                </div>
            </div>
        )
    }

    setPublication(published){
        console.log(published);
        if(published==this.state.published)return;
        let component=this;
        if(!published || window.confirm(gettext("Are you sure you want to publish this project, making it fully visible to anyone with an account?"))){
            updateValueInstant(component.props.data.id,component.props.data.type,{published:published},()=>component.setState({published:published}));
        }
    }
    
    setUserPermission(permission_type,user){
        this.tiny_loader.startLoad();
        setUserPermission(user.id,this.props.data.id,this.props.data.type,permission_type,()=>{
            getUsersForObject(this.props.data.id,this.props.data.type,(response)=>{
                this.setState({view:response.viewers,comment:response.commentors,edit:response.editors,student:response.students});
                this.tiny_loader.endLoad();
            });
        });
    }
    
    componentDidMount(){
        getUsersForObject(this.props.data.id,this.props.data.type,(response)=>{
            this.setState({owner:response.author,view:response.viewers,comment:response.commentors,edit:response.editors,student:response.students,published:response.published});
        });
    }
    
    
    
}

class UserLabel extends React.Component{
    constructor(props){
        super(props);
        this.select = React.createRef();
    }
    
    render(){
        let permission_select;
        if(this.props.type!="owner"){
            if(this.props.type=="add"){
                permission_select = (
                    <div class="permission-select">
                        <select ref={this.select}>
                            <option value="edit">{gettext("Can edit")}</option>
                            <option value="comment">{gettext("Can comment")}</option>
                            <option value="view">{gettext("Can view")}</option>
                            {/*<option value="student">{gettext("Student")}</option>*/}
                        </select>
                        <button onClick={()=>this.props.addFunction($(this.select.current).val())}>{gettext("Share")}</button>
                    </div>
                )
            }else{
                permission_select = (
                    <div class="permission-select">
                        <select value={this.props.type} onChange={this.onChange.bind(this)}>
                            <option value="edit">{gettext("Can edit")}</option>
                            <option value="comment">{gettext("Can comment")}</option>
                            <option value="view">{gettext("Can view")}</option>
                            {/*<option value="student">{gettext("Student")}</option>*/}
                            <option value="none">{gettext("Remove user")}</option>
                        </select>
                    </div>
                );
            }
            
        }
        
        
        return (
            <li class="user-label">
                <div>
                    <div class="user-name">
                        {this.props.user.first_name+" "+this.props.user.last_name}
                    </div>
                    <div class="user-username">
                        {this.props.user.username}
                    </div>
                </div>
                {permission_select}
            </li>
        );
    }
    
    onChange(evt){
        switch(evt.target.value){
            case "none":
                if(window.confirm("Are you sure you want to remove this user?")){
                    this.props.permissionChange(0,this.props.user);
                }
                break;
            default:
                this.props.permissionChange(Constants.permission_keys[evt.target.value],this.props.user);
        }
    }
    
}

class UserAdd extends React.Component{
    constructor(props){
        super(props);
        this.input = React.createRef();
        this.state={selected:null};
        
    }
    
    render(){
        
        let disabled = (this.state.selected===null)
        
        let user;
        if(this.state.selected){
            user = (
                <UserLabel user={this.state.selected} type="add" addFunction={this.addClick.bind(this)}/>
            )
        }
        
        return (
            <div class="user-add">
                <h4>{gettext("Add A User")}:</h4>
                <div>{gettext("Begin typing to search users. Select the desired user then click Share.")}</div>
                <input ref={this.input}/>
                {user}
            </div>
        );
    }
    
    componentDidMount(){
        let component = this;
        $(this.input.current).autocomplete({
            source:(request,response_function)=>{
                getUserList(
                    request.term,
                    (response)=>{
                        let user_list = response.user_list.map((user)=>{
                            return {label:user.first_name+" "+user.last_name+" - "+user.username,value:user.username,user:user}
                        });
                        response_function(user_list);
                    }
                )
                component.setState({selected:null});
            },
            select:(evt,ui)=>{
                this.setState({selected:ui.item.user})
            },
            minLength:1,
            
        });
    }

    addClick(value){
        if(this.state.selected){
            this.props.permissionChange(Constants.permission_keys[value],this.state.selected);
            $(this.input.current).val(null);
                this.setState({selected:null})
        }
    }
}


