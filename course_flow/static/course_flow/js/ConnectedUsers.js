import * as React from "react";
import * as reactDom from "react-dom";


//Container for common elements for workflows
export class ConnectionBar extends React.Component{
    constructor(props){
        super(props);
        this.state={connnected_users:[]};
    }
    
    
    render(){
        let users = this.state.connected_users.map(user=>
            <ConnectedUser user_data={user}/>
        );
    }
    
    componentDidMount(){
        this.connection_update();
    }
    
    connection_update(){
        this.props.updateSocket.send(JSON.stringify({type:"connection_update",user_data:{user_id:user_id,user_name:user_name,user_colour:myColour,connected:true}}))
        setTimeout(this.connection_update,10000);
    }
    
    connection_update_received(user_data){
        let connected_users=this.state.connected_users.slice();
        console.log(user_data);
        let found_user=false;
        for(let i=0;i<connected_users.length;i++){
            if(connected_users[i].user_id==user_data.user_id){
                found_user=true;
                clearTimeout(connected_users[i].timeout);
                connected_users[i] = {...user_data,timeout:setTimeout(()=>{
                    this.removeConnection(user_data);
                },15000)}
                break;
            }
        }
        if(!found_user)connected_users.push({...user_data,timeout:setTimeout(()=>{
            this.removeConnection(user_data);
        },15000)});
        this.setState({connected_users:connected_users});
    }
    
    removeConnection(user_data){
        let connected_users=this.state.connected_users.slice();
        for(let i=0;i<connected_users.length;i++){
            if(connected_users[i].user_id==user_data.user_id){
                connected_users=connected_users.splice(i,1);
            }
        }
        this.setState({connected_users:connected_users});
        
    }
     
    
}

export class ConnectedUser extends React.Component{
    render(){
        let data = this.props.user_data;
        return(
            <div class="user-indicator" title=data.user_name>
                {data.user_name[0]}
            </div>
        );
    }
}

