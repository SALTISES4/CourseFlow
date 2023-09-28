import {Component, createRef} from "react";
import * as reactDom from "react-dom";
import * as React from "react";
import {LiveProjectMenu, StudentLiveProjectMenu} from "../LiveProjectView";
import {LiveAssignmentMenu} from "../LiveAssignmentView";
import 'flatpickr/dist/flatpickr.css';



export class LiveProjectRenderer{
    constructor(live_project_data,project_data){
        this.live_project_data = live_project_data;
        this.project_data = project_data;
        this.user_role = user_role;
        this.user_permission = user_permission;
    }

    render(container){
        this.container=container;
        this.tiny_loader = new renderers.TinyLoader($("body")[0]);

        reactDom.render(
            this.getContents(),
            container[0]
        );
    }

    getContents(){
        if(user_role == 2){
            return <LiveProjectMenu renderer={this} project={this.project_data} liveproject={this.live_project_data}/>
        }else{
            return <StudentLiveProjectMenu renderer={this} project={this.project_data} liveproject={this.live_project_data}/>
        }
    }
}

export class LiveAssignmentRenderer{
    constructor(assignment_data,live_project_data){
        this.live_project_data = live_project_data;
        this.assignment_data = assignment_data;
        this.user_role = user_role;
    }

    render(container){
        this.container=container;
        this.tiny_loader = new renderers.TinyLoader($("body")[0]);

        reactDom.render(
            this.getContents(),
            container[0]
        );
    }

    getContents(){
        return <LiveAssignmentMenu renderer={this} assignment_data={this.assignment_data} live_project_data={this.live_project_data}/>
    }
}
