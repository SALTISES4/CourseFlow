import * as Redux from "redux";
import * as React from "react";
import * as reactDom from "react-dom";
import {setUserPermission,getUsersForObject,getUserList} from "./PostFunctions";
import * as Constants from "./Constants";

export class ShareMenu extends React.Component{
    constructor(props){
        super(props);
        this.tiny_loader = new renderers.TinyLoader($("body"));
        this.state={owner:props.data.author,edit:[],view:[],comment:[],userlist:[]}
    }
    
    render(){
        let data = this.props.data
        let owner = (
            <UserLabel user={this.state.owner} type={"owner"}/>
        );
        let editors = this.state.edit.map((user)=>
            <UserLabel user={user} type={"edit"} permissionChange={this.setUserPermission.bind(this)}/>
        );
        let viewers = this.state.view.map((user)=>
            <UserLabel user={user} type={"view"} permissionChange={this.setUserPermission.bind(this)}/>
        );
        let commentors = this.state.comment.map((user)=>
            <UserLabel user={user} type={"comment"} permissionChange={this.setUserPermission.bind(this)}/>
        );

        let text = data.title;
        if(text==null || text==""){
            text=gettext("Untitled");
        }

        let share_info;
        if(data.type=="project"){
            share_info=gettext("Note: You are sharing a project. Any added users will be granted the same permission for all workflows within the project.");
        }else{
            share_info=gettext("Note: You are sharing a workflow. Any added users will be granted view permissions for the whole project.");
        }
        
        return(
            <div class="message-wrap user-text">
                <h3>{gettext("Sharing")+":"}</h3>
                <div class="workflow-title-bar">
                    <div>
                        {text}
                    </div>
                </div>
                <h4>Owned By:</h4>
                    <div>{owner}</div>
                <div class="user-panel">
                    <h4>Shared With:</h4>
                    <ul class="user-list">
                        {editors}
                        {commentors}
                        {viewers}
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
    
    setUserPermission(permission_type,user){
        this.tiny_loader.startLoad();
        setUserPermission(user.id,this.props.data.id,this.props.data.type,permission_type,()=>{
            getUsersForObject(this.props.data.id,this.props.data.type,(response)=>{
                this.setState({view:response.viewers,comment:response.commentors,edit:response.editors});
                this.tiny_loader.endLoad();
            });
        });
    }
    
    componentDidMount(){
        getUsersForObject(this.props.data.id,this.props.data.type,(response)=>{
            this.setState({owner:response.author,view:response.viewers,comment:response.commentors,edit:response.editors});
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
                <div>{gettext("Begin typing to search users. Select the desired user then click Share'.")}</div>
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
                console.log("selecting");
                console.log(ui);
                this.setState({selected:ui.item.user})
            },
            minLength:1,
            
        });
    }

    addClick(value){
        if(this.state.selected){
            console.log("PERMISSION TYPE:");
            console.log(Constants.permission_keys[value]);
            this.props.permissionChange(Constants.permission_keys[value],this.state.selected);
            $(this.input.current).val(null);
                this.setState({selected:null})
        }
    }
}


