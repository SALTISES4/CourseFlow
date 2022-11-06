import {Component, createRef} from "react";
import * as reactDom from "react-dom";
import * as React from "react";
import {LiveProjectMenu, StudentLiveProjectMenu} from "./LiveProjectView";



export class LiveProjectRenderer{
    constructor(live_project_data,project_data){
        this.live_project_data = live_project_data;
        this.project_data = project_data;
    }
    
    render(container){
        this.container=container;
        
        reactDom.render(
            this.getContents(),
            container[0]
        );
        
    }

    getContents(){
        if(user_role == 2){
            return <LiveProjectMenu project={this.project_data} liveproject={this.live_project_data}/>
        }else{
            return <StudentLiveProjectMenu project={this.project_data} liveproject={this.live_project_data}/>
        }
    }
}













