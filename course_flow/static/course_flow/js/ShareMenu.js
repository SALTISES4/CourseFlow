import * as Redux from "redux";
import * as React from "react";
import * as reactDom from "react-dom";
import {setUserPermission,getUsersForObject,getUserList} from "./PostFunctions";
import {Loader} from "./Constants";

export class ShareMenu extends React.Component{
    constructor(props){
        super(props);
        this.state={owner:props.data.author,edit:[],view:[],userlist:[]}
    }
    
    render(){
        let data = this.props.data;
        
        let editors = this.state.edit.map((user)=>
            <UserLabel user={user} removeClick={this.setUserPermission.bind(this,0)}/>
        );
        if(editors.length==0)editors=<li>None</li>;
        let viewers = this.state.view.map((user)=>
            <UserLabel user={user} removeClick={this.setUserPermission.bind(this,0)}/>
        );
        if(viewers.length==0)viewers=<li>None</li>;
        console.log(this.props.actionFunction);
        return(
            <div class="message-wrap">
                <h3>Sharing Options:</h3>
                <h4>Owned By:</h4>
                    <div>{this.state.owner}</div>
                <div class="user-panel">
                    <h4>Editors:</h4>
                    <ul class="user-list">
                        {editors}
                    </ul>
                    <UserAdd addFunction={this.setUserPermission.bind(this,2)}/>
                </div>
                <div class="user-panel">
                    <h4>Viewers:</h4>
                    <ul class="user-list">
                        {viewers}
                    </ul>
                    <UserAdd addFunction={this.setUserPermission.bind(this,1)}/>
                </div>
                <div class="window-close-button" onClick = {this.props.actionFunction}>
                    <img src = {iconpath+"close.svg"}/>
                </div>
            </div>
        );
        
        
    }
    
    setUserPermission(permission_type,user){
        console.log(user);
        console.log(user.id);
        setUserPermission(user.id,this.props.data.id,this.props.data.type,permission_type,()=>{
            getUsersForObject(this.props.data.id,this.props.data.type,(response)=>{
                this.setState({view:response.viewers,edit:response.editors});
            });
        });
    }
    
    componentDidMount(){
        console.log(this.props.data);
        getUsersForObject(this.props.data.id,this.props.data.type,(response)=>{
            this.setState({view:response.viewers,edit:response.editors});
        });
    }
    
    
    
}

class UserLabel extends React.Component{
    render(){
        
        return (
            <li class="user-label">
                <div>
                    {this.props.user.username}
                </div>
                <div  class="window-close-button" onClick={(evt)=>{
                    if(window.confirm("Are you sure you want to remove this user?")){
                        this.props.removeClick(this.props.user);
                    }
                }}>
                    <img src={iconpath+'close.svg'} title="Delete"/>
                </div>
            </li>
        );
    }
    
}

class UserAdd extends React.Component{
    constructor(props){
        super(props);
        this.input = React.createRef()
        this.state={selected:null}
    }
    
    render(){
        
        let disabled = (this.state.selected===null)
        return (
            <div class="user-add">
                <input ref={this.input}/>
                <button onClick={this.addClick.bind(this)} disabled={disabled}><img src={iconpath+'add_new.svg'}/></button>
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
                            return {label:user.username,value:user.username,id:user.id}
                        });
                        response_function(user_list);
                    }
                )
                component.setState({selected:null});
            },
            select:(evt,ui)=>{
                this.setState({selected:ui.item})
            },
            minLength:1,
            
        });
    }

    addClick(evt){
        console.log(this.state.selected);
        console.log(this.state);
        this.props.addFunction(this.state.selected);
    }
    
    
}