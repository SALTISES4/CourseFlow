import {h, Component, render} from "preact";


export class StrategyView extends Component{
    render(){
        
    }
}

export class WorkflowView extends Component{
    constructor(state){
        super();
        this.state=state;
    }
    
    render(){
        
        
        return (
            <svg class="workflow-container">
            
            </svg>
        );
    }
}


export function renderWorkflowView(container){
    render(<WorkflowView/>,container)
}
