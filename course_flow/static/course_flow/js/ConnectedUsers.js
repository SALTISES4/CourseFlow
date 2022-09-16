import * as React from "react";
import * as reactDom from "react-dom";


//Container for common elements for workflows
export class ConnectionBar extends React.Component{
    constructor(props){
        super(props);
        this.state={connected_users:[]};
        let connection_bar=this;
        props.renderer.connection_update_received = (user_data)=>{
            connection_bar.connection_update_received(user_data);
        }
        console.log("created connection bar");
        console.log(this.props.updateSocket.readyState);
    }
    
    
    render(){
        if(this.props.updateSocket.readyState==1){
            let users = this.state.connected_users.map(user=>
                <ConnectedUser user_data={user}/>
            );
            
            return (
                <div class="users-box">
                    <div class="users-small-wrapper">
                        <div class="users-small">
                            {users.slice(0,2)}
                        </div>
                    </div>
                    <div class="users-more">
                        ...
                    </div>
                    <div class="users-hidden">
                        {users}
                    </div>
                </div>
            )
        }else if(this.props.updateSocket.readyState==3){
            return (
                <div class="users-box connection-failed">
                    {gettext("Not Connected")}
                </div>
            )
        }
    }
    
    componentDidMount(){
        this.connection_update();
    }
    
    connection_update(connected=true){
        if(this.props.updateSocket.readyState==1)this.props.updateSocket.send(JSON.stringify({type:"connection_update",user_data:{user_id:user_id,user_name:user_name,user_colour:myColour,connected:connected}}))
        setTimeout(this.connection_update.bind(this),30000);
    }
    
    connection_update_received(user_data){
        if(user_data.connected){
            let connected_users=this.state.connected_users.slice();
            let found_user=false;
            for(let i=0;i<connected_users.length;i++){
                if(connected_users[i].user_id==user_data.user_id){
                    found_user=true;
                    clearTimeout(connected_users[i].timeout);
                    connected_users[i] = {...user_data,timeout:setTimeout(
                        this.removeConnection.bind(this,user_data)
                    ,60000)}
                    break;
                }
            }
            if(!found_user)connected_users.push({...user_data,timeout:setTimeout(
                this.removeConnection.bind(this,user_data)
            ,60000)});
            this.setState({connected_users:connected_users});
        }else this.removeConnection(user_data);
    }
    
    removeConnection(user_data){
        let connected_users=this.state.connected_users.slice();
        for(let i=0;i<connected_users.length;i++){
            if(connected_users[i].user_id==user_data.user_id){
                if(connected_users[i].timeout)clearTimeout(connected_users[i].timeout)
                connected_users.splice(i,1);
                break;
            }
        }
        this.setState({connected_users:connected_users});
        
    }
     
    
}

export class ConnectedUser extends React.Component{
    render(){
        let data = this.props.user_data;
        return(
            <div class="user-indicator" style={{backgroundColor:data.user_colour}} title={data.user_name}>
                {data.user_name[0]}
            </div>
        );
    }
}

