import {Component, createRef} from "react";
import * as reactDom from "react-dom";
import * as React from "react";
import {LibraryMenu, ProjectMenu} from "./Library";
import * as Constants from "./Constants";



export class LibraryRenderer{
    constructor(){
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
        return (
            <LibraryMenu renderer={this}/>
        )
    }
}

export class ProjectRenderer{
    constructor(project_data,disciplines){
        this.project_data=project_data;
        this.all_disciplines=disciplines;
        this.read_only=true;
        if(
            project_data.object_permission && 
            project_data.object_permission.permission_type==Constants.permission_keys["edit"]
        )this.read_only=false;
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
        return (
            <ProjectMenu renderer={this} data={this.project_data}/>
        )
    }
}













