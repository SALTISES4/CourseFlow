import * as Redux from "redux";
import * as React from "react";
import * as reactDom from "react-dom";
import {setUserPermission,getUsersForObject,getUserList,updateValueInstant} from "../../PostFunctions.js";
import {WorkflowTitle} from "./CommonComponents.js";
import * as Constants from "../../Constants.js";

export class ShareMenu extends React.Component{
    constructor(props){
        super(props);
        this.tiny_loader = new renderers.TinyLoader($("body"));
        this.state={owner:props.data.author,edit:[],view:[],comment:[],student:[],userlist:[],cannot_change:[]}
    }

    render(){
        let data = this.props.data
        let owner = (
            <UserLabel user={this.state.owner} type={"owner"}/>
        );
        let editors = this.state.edit.filter(user=>user.id!=this.state.owner.id).map((user)=>
            <UserLabel user={user} type={"edit"} cannot_change={this.state.cannot_change} permissionChange={this.setUserPermission.bind(this)}/>
        );
        let viewers = this.state.view.map((user)=>
            <UserLabel user={user} type={"view"} cannot_change={this.state.cannot_change} permissionChange={this.setUserPermission.bind(this)}/>
        );
        let commentors = this.state.comment.map((user)=>
            <UserLabel user={user} type={"comment"} cannot_change={this.state.cannot_change} permissionChange={this.setUserPermission.bind(this)}/>
        );
        let students = this.state.student.map((user)=>
            <UserLabel user={user} type={"student"} cannot_change={this.state.cannot_change} permissionChange={this.setUserPermission.bind(this)}/>
        );

        let share_info;
        if(data.type=="project"){
            share_info=gettext("Invite collaborators to project and its workflows");
        }else{
            share_info=gettext("Invite collaborators to workflow and grant view permissions to the project");
        }
        let shared_with;
        if(editors.length || commentors.length || viewers.length || students.length){
            shared_with=[
                <hr/>,
                <div class="user-panel">
                    <p>{gettext("Shared With")}:</p>
                    <ul class="user-list">
                        {editors}
                        {commentors}
                        {viewers}
                        {students}
                    </ul>
                </div>
            ]
        }


        return(
            <div class="message-wrap user-text">
                <h2>
                    {gettext("Share")+" "+gettext(data.type)+" "}
                    <WorkflowTitle no_hyperlink={true} data={this.props.data} class_name={"inline"}/>
                </h2>
                {this.getPublication()}
                <hr/>
                <p>{gettext("Owned By")}:</p>
                <div>{owner}</div>
                <hr/>
                <UserAdd permissionChange={this.setUserPermission.bind(this)} share_info={share_info}/>
                {shared_with}
                <div class="window-close-button" onClick = {this.props.actionFunction}>
                    <span class="green material-symbols-rounded">close</span>
                </div>
                <div class="action-bar"><button class="secondary-button" onClick={this.props.actionFunction}>{gettext("Close")}</button></div>
            </div>
        );

    }

    getPublication(){
        let published=this.state.published;
        let data=this.props.data;
        if(data.type=="project" || data.is_strategy){
            let public_class="big-button make-public";
            let private_class="big-button hover-shade make-private";
            if(published)public_class+=" active";
            else private_class+=" active";
            let public_disabled = !(data.title && data.title.length > 0);
            if(data.type=="project")public_disabled |= (data.disciplines.length==0);
            if(!public_disabled && !published)public_class+=" hover-shade";
            if(public_disabled)public_class+=" disabled";
            let public_text=gettext("Any CourseFlow teacher can view");
            let disabled_indicator;
            if(public_disabled){
                let disabled_text;
                if(data.type=="project")disabled_text=gettext("Title and disciplines are required to publish.");
                else disabled_text=gettext("Title is required to publish.");
                disabled_indicator=(
                    <div class="warning flex-middle">
                        <span class = "material-symbols-rounded red">block</span><div>{disabled_text}</div>
                    </div>
                )
            }
            return (
                [<div class="big-buttons-wrapper">
                    <div class={public_class} disabled={public_disabled} onClick={this.setPublication.bind(this,true && !public_disabled)}>
                        <span class="material-symbols-rounded">public</span>
                        <div class="big-button-title">{gettext("Public to CourseFlow")}</div>
                        <div class="big-button-description">{public_text}</div>
                    </div>
                    <div class={private_class} onClick={this.setPublication.bind(this,false)}>
                        <span class="material-symbols-rounded filled">visibility_off</span>
                        <div class="big-button-title">{gettext("Private")}</div>
                        <div class="big-button-description">{gettext("Only added collaborators can view")}</div>
                    </div>
                </div>,
                disabled_indicator]
            )
        }else{
            let published_icon;
            if(published)published_icon = (
                <div class="big-buttons-wrapper">
                    <div class="big-button active">
                        <span class="material-symbols-rounded">public</span>
                        <div class="big-button-title">{gettext("Project public to CourseFlow")}</div>
                        <div class="big-button-description">{gettext("Any CourseFlow teacher can view")}</div>
                    </div>
                </div>
            );
            else published_icon = (
                <div class="big-buttons-wrapper">
                    <div class="big-button active">
                        <span class="material-symbols-rounded filled">visibility_off</span>
                        <div class="big-button-title">{gettext("Project is private")}</div>
                        <div class="big-button-description">{gettext("Only added collaborators can view")}</div>
                    </div>
                </div>
            );
            return [published_icon,this.getPublicLink()]
        }
    }

    getPublicLink(){
        let data=this.props.data;
        let public_link = window.location.host+public_update_path["workflow"].replace("0",data.id);
        if(data.type!="project"){
            let public_view = this.state.public_view;
            if(!public_view)return (
                <div class="public-link-button  hover-shade" onClick = {this.togglePublicView.bind(this,!public_view)}>
                    <div class="public-link-icon"><span class="material-symbols-rounded">add_link</span></div>
                    <div>
                        <div class="public-link-text">{gettext("Generate a public link")}</div>
                        <div class="public-link-description">{gettext("Anyone with the link will be able to view the workflow")}}</div>
                    </div>
                </div>
            );
            else return [
                <div class="public-link-button  hover-shade" onClick = {()=>{
                    navigator.clipboard.writeText(public_link);
                    let copy_icon_text = $(".copy-link-icon .material-symbols-rounded").text();
                    let copy_description_text = $(".copy-link-text").text();
                    $(".copy-link-icon .material-symbols-rounded").text("done");
                    $(".copy-link-text").text("Copied to Clipboard");
                    setTimeout(()=>{
                        $(".copy-link-icon .material-symbols-rounded").text(copy_icon_text);
                        $(".copy-link-text").text(copy_description_text);
                    },1000)
                }}>
                    <div class="copy-link-icon"><span class="material-symbols-rounded">link</span></div>
                    <div>
                        <div class="copy-link-text">{gettext("Copy public link")}</div>
                        <div class="public-link-description">{gettext("Anyone with the link can view the workflow")}}</div>
                    </div>
                </div>,
                <div class="public-link-button public-link-remove  hover-shade" onClick = {this.togglePublicView.bind(this,!public_view)}>
                    <div class="public-link-icon"><span class="material-symbols-rounded">link_off</span></div>
                    <div>
                        <div class="public-link-text">{gettext("Remove public link")}</div>
                    </div>
                </div>
            ];
        }
    }

    togglePublicView(public_view){
        if(public_view){
            if(window.confirm(gettext("Please note: this will make a publicly accessible link to your workflow, which can be accessed even by those without an account. They will still not be able to edit your workflow."))){
                updateValueInstant(this.props.data.id,"workflow",{public_view:public_view},()=>{
                    this.setState({public_view:public_view})
                });
            }
        }else{
            updateValueInstant(this.props.data.id,"workflow",{public_view:public_view},()=>{
                this.setState({public_view:public_view})
            });
        }
    }

    setPublication(published){
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
            this.setState({owner:response.author,view:response.viewers,comment:response.commentors,edit:response.editors,student:response.students,published:response.published,public_view:response.public_view,cannot_change:response.cannot_change});
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
        let disabled=false;
        if(this.props.cannot_change && this.props.cannot_change.indexOf(this.props.user.id)>=0)disabled=true;
        if(this.props.type!="owner"){
            if(this.props.type=="add"){
                permission_select = (
                    <div class="flex-middle">
                        <div class="permission-select">
                            <select ref={this.select} disabled={disabled}>
                                <option value="edit">{gettext("Can edit")}</option>
                                <option value="comment">{gettext("Can comment")}</option>
                                <option value="view">{gettext("Can view")}</option>
                                {/*<option value="student">{gettext("Student")}</option>*/}
                            </select>
                        </div>
                        <button class="primary-button" onClick={()=>this.props.addFunction($(this.select.current).val())}>{gettext("Share")}</button>
                    </div>
                )
            }else{
                permission_select = (
                    <div class="permission-select">
                        <select value={this.props.type} disabled={disabled} onChange={this.onChange.bind(this)}>
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
                <p>{this.props.share_info}</p>
                <div class="relative">
                    <input class="search-input" ref={this.input} placeholder={gettext("Begin typing to search users")}/>
                    <span class="material-symbols-rounded">search</span>
                </div>
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


