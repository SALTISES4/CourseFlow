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
            <UserLabel user={user}/>
        );
        if(editors.length==0)editors=<li>None</li>;
        let viewers = this.state.view.map((user)=>
            <UserLabel user={user}/>
        );
        if(viewers.length==0)viewers=<li>None</li>;
        
        return(
            <div>
                <h4>Owned By:</h4>
                    <div>{this.state.owner}</div>
                <h4>Editors:</h4>
                <ul>
                    {editors}
                </ul>
                <UserAdd permission_type={2}/>
                <h4>Viewers:</h4>
                <ul>
                    {viewers}
                </ul>
                <UserAdd permission_type={1}/>
                <div class="window-close-button" onClick = {this.props.actionFunction}>
                    <img src = {iconpath+"close.svg"}/>
                </div>
            </div>
        );
        
        
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
            <li>{this.props.user.username}</li>
        );
    }
}

class UserAdd extends React.Component{
    constructor(props){
        super(props);
        this.input = React.createRef()
    }
    
    render(){
        
        
        return (
            <input ref={this.input}/>
        );
    }
    
    componentDidMount(){
        $(this.input.current).autocomplete({
            source:(request,response_function)=>{
                getUserList(
                    request.term,
                    (response)=>{
                        let user_list = response.user_list.map((user)=>{
                            return {label:user.username,value:user.id}
                        });
                        response_function(user_list);
                    }
                )
            },
            select:(evt,ui)=>{
                console.log(ui.item);
            }
            minLength:1,
            
        });
    }
    
    
}