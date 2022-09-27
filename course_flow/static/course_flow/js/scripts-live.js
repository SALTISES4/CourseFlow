import {Component, createRef} from "react";
import * as reactDom from "react-dom";
import * as React from "react";
import {LiveProjectMenu} from "./LiveProjectView";



export class LiveProjectRenderer{
    constructor(live_project_data,project_data){
        this.live_project_data = live_project_data;
        this.project_data = project_data;
    }
    
    render(container){
        this.container=container;
        
        reactDom.render(
            <LiveProjectMenu project={this.project_data}/>,
            container[0]
        );
        
    }
}













