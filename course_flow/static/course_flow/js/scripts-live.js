import {Component, createRef} from "react";
import * as reactDom from "react-dom";
import * as React from "react";



export class LiveProjectRenderer{
    constructor(live_projecT_data,project_data){
        this.live_project_data = live_project_data;
        this.project_data = project_data;
    }
    
    render(container){
        this.container=container;
        
        reactDom.render(
            <Provider store = {this.store}>
                <ProjectMenu project={this.project_data}/>
            </Provider>,
            container[0]
        );
        
    }
}


class DivLoader extends React.Component{
    
    render(){
        return (
            <div class="load-screen">
                
            </div>
        
        )
    }
}












